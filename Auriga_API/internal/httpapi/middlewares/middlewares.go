package middlewares

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/remrafvil/Auriga_API/internal/services/sAuth"
	"github.com/remrafvil/Auriga_API/internal/utils"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// Función helper para min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

const CacheTTL = 5 * time.Minute

type CachedValidationResult struct {
	Valid   bool
	Claims  jwt.MapClaims
	Expires time.Time
}

type AuthMiddleware struct {
	validator   *sAuth.JWKSValidator
	logger      *zap.Logger
	authService sAuth.Service
	tokenCache  map[string]CachedValidationResult
	cacheMutex  sync.RWMutex
	cacheTTL    time.Duration
}

type AuthMiddlewareParams struct {
	fx.In
	Validator   *sAuth.JWKSValidator
	Logger      *zap.Logger
	AuthService sAuth.Service
}

func NewAuthMiddleware(p AuthMiddlewareParams) *AuthMiddleware {
	return &AuthMiddleware{
		validator:   p.Validator,
		logger:      p.Logger,
		authService: p.AuthService,
		tokenCache:  make(map[string]CachedValidationResult),
		cacheTTL:    CacheTTL,
	}
}

func (m *AuthMiddleware) CombinedMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			m.logger.Info("🔐 [MIDDLEWARE] CombinedMiddleware ejecutándose",
				zap.String("path", c.Path()),
				zap.String("uri", c.Request().RequestURI),
				zap.String("method", c.Request().Method),
				zap.String("remote_ip", c.RealIP()))

			// Listar todas las cookies recibidas
			allCookies := c.Cookies()
			m.logger.Info("🍪 [MIDDLEWARE] Cookies recibidas",
				zap.Int("total_cookies", len(allCookies)),
				zap.Any("cookie_names", func() []string {
					names := make([]string, len(allCookies))
					for i, c := range allCookies {
						names[i] = c.Name
					}
					return names
				}()))

			// Verificar header Authorization
			authHeader := c.Request().Header.Get("Authorization")
			m.logger.Info("🔍 [MIDDLEWARE] Verificando token",
				zap.Bool("has_auth_header", authHeader != ""),
				zap.String("auth_header_preview", func() string {
					if authHeader != "" && len(authHeader) > 20 {
						return authHeader[:20] + "..."
					}
					return authHeader
				}()))

			tokenString, source := m.extractToken(c)
			if tokenString == "" {
				m.logger.Warn("⚠️ [MIDDLEWARE] No se encontró token",
					zap.String("path", c.Path()),
					zap.String("uri", c.Request().RequestURI),
					zap.String("method", c.Request().Method))
				return echo.NewHTTPError(http.StatusUnauthorized, "Authentication required")
			}

			m.logger.Info("✅ [MIDDLEWARE] Token extraído",
				zap.String("source", source),
				zap.String("token_length", fmt.Sprintf("%d", len(tokenString))),
				zap.String("token_preview", tokenString[:min(20, len(tokenString))]+"..."))

			if m.authService.IsTokenRevoked(tokenString) {
				m.logger.Warn("❌ [MIDDLEWARE] Intento de usar token revocado",
					zap.String("path", c.Path()))
				return echo.NewHTTPError(http.StatusUnauthorized, "Token has been revoked")
			}

			if claims, found := m.getFromCache(tokenString); found {
				m.logger.Info("✅ [MIDDLEWARE] Token encontrado en caché",
					zap.String("path", c.Path()))
				m.setUserContext(c, claims)

				// ✅ VALIDAR ESTADO 'active' DEL USUARIO INCLUSO SI EL TOKEN ESTÁ EN CACHÉ
				if userID, ok := claims["sub"].(string); ok {
					m.logger.Info("🔍 [MIDDLEWARE] Verificando estado del usuario en BD (desde caché)",
						zap.String("user_id", userID),
						zap.String("path", c.Path()))

					employee, err := m.authService.FindCurrentUserInfo(userID, c.Request().Context())
					if err != nil {
						m.logger.Warn("⚠️ [MIDDLEWARE] No se pudo obtener información del usuario (caché)",
							zap.Error(err),
							zap.String("user_id", userID),
							zap.String("path", c.Path()))
					} else if employee != nil {
						m.logger.Info("📊 [MIDDLEWARE] Estado del usuario verificado (desde caché)",
							zap.Uint("employee_id", employee.ID),
							zap.String("email", employee.Email),
							zap.Bool("active", employee.Active),
							zap.String("path", c.Path()))

						if !employee.Active {
							m.logger.Warn("🚫 [MIDDLEWARE] Usuario bloqueado intentando acceder (desde caché)",
								zap.Uint("employee_id", employee.ID),
								zap.String("email", employee.Email),
								zap.String("user_id", userID),
								zap.String("path", c.Path()))
							// Limpiar el token del caché
							m.ClearTokenCache(tokenString)
							return echo.NewHTTPError(http.StatusForbidden,
								"Your account has been disabled. Please contact your administrator.")
						}

						m.logger.Info("✅ [MIDDLEWARE] Usuario activo, permitiendo acceso (desde caché)",
							zap.Uint("employee_id", employee.ID),
							zap.String("email", employee.Email),
							zap.String("path", c.Path()))
					}
				}

				return next(c)
			}

			m.logger.Info("🔄 [MIDDLEWARE] Validando token con JWKS...")
			token, err := m.validator.ValidateToken(tokenString)
			if err != nil {
				m.logger.Warn("❌ [MIDDLEWARE] Validación de token falló",
					zap.Error(err),
					zap.String("error_type", fmt.Sprintf("%T", err)),
					zap.String("path", c.Path()))
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid token: "+err.Error())
			}

			m.logger.Info("✅ [MIDDLEWARE] Token validado exitosamente",
				zap.String("path", c.Path()))

			// ✅ CORREGIDO: Manejar ambos tipos de claims
			var claims jwt.MapClaims
			if tokenClaims, ok := token.Claims.(*jwt.MapClaims); ok {
				claims = *tokenClaims
			} else if tokenClaims, ok := token.Claims.(jwt.MapClaims); ok {
				claims = tokenClaims
			} else {
				m.logger.Error("❌ [MIDDLEWARE] Formato de claims inválido",
					zap.String("claims_type", fmt.Sprintf("%T", token.Claims)),
					zap.String("path", c.Path()))
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid token claims format")
			}

			m.setToCache(tokenString, claims)
			m.setUserContext(c, claims)

			// ✅ VALIDAR ESTADO 'active' DEL USUARIO EN LA BASE DE DATOS
			if userID, ok := claims["sub"].(string); ok {
				m.logger.Info("🔍 [MIDDLEWARE] Verificando estado del usuario en BD",
					zap.String("user_id", userID),
					zap.String("path", c.Path()))

				// Obtener información del usuario desde la base de datos
				employee, err := m.authService.FindCurrentUserInfo(userID, c.Request().Context())
				if err != nil {
					m.logger.Warn("⚠️ [MIDDLEWARE] No se pudo obtener información del usuario",
						zap.Error(err),
						zap.String("user_id", userID),
						zap.String("path", c.Path()))
					// Continuar si no se puede obtener (puede ser un usuario nuevo)
				} else if employee != nil {
					m.logger.Info("📊 [MIDDLEWARE] Estado del usuario verificado",
						zap.Uint("employee_id", employee.ID),
						zap.String("email", employee.Email),
						zap.Bool("active", employee.Active),
						zap.String("path", c.Path()))

					// ✅ VALIDAR QUE EL USUARIO ESTÉ ACTIVO
					if !employee.Active {
						m.logger.Warn("🚫 [MIDDLEWARE] Usuario bloqueado intentando acceder",
							zap.Uint("employee_id", employee.ID),
							zap.String("email", employee.Email),
							zap.String("user_id", userID),
							zap.String("path", c.Path()))
						return echo.NewHTTPError(http.StatusForbidden,
							"Your account has been disabled. Please contact your administrator.")
					}

					m.logger.Info("✅ [MIDDLEWARE] Usuario activo, permitiendo acceso",
						zap.Uint("employee_id", employee.ID),
						zap.String("email", employee.Email),
						zap.String("path", c.Path()))
				}

				m.logger.Info("✅ [MIDDLEWARE] Token validado y contexto establecido",
					zap.String("user_id", userID),
					zap.String("source", source),
					zap.String("path", c.Path()))
			} else {
				m.logger.Warn("⚠️ [MIDDLEWARE] No se pudo extraer user_id de claims",
					zap.String("path", c.Path()))
			}

			return next(c)
		}
	}
}

func (m *AuthMiddleware) extractToken(c echo.Context) (string, string) {
	// 1. Intentar obtener token del header Authorization
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1], "header"
		}
	}

	// 2. Si no hay header, buscar en cookies
	cookie, err := c.Cookie("auth_token")
	if err == nil && cookie.Value != "" {
		return cookie.Value, "cookie"
	}

	return "", ""
}

func (m *AuthMiddleware) getFromCache(tokenString string) (jwt.MapClaims, bool) {
	m.cacheMutex.RLock()
	defer m.cacheMutex.RUnlock()

	if result, exists := m.tokenCache[tokenString]; exists {
		if time.Now().Before(result.Expires) {
			return result.Claims, true
		}
		delete(m.tokenCache, tokenString)
	}
	return nil, false
}

func (m *AuthMiddleware) setToCache(tokenString string, claims jwt.MapClaims) {
	m.cacheMutex.Lock()
	defer m.cacheMutex.Unlock()

	m.tokenCache[tokenString] = CachedValidationResult{
		Valid:   true,
		Claims:  claims,
		Expires: time.Now().Add(m.cacheTTL),
	}

	if len(m.tokenCache) > 1000 {
		m.cleanupCache()
	}
}

func (m *AuthMiddleware) cleanupCache() {
	now := time.Now()
	for token, result := range m.tokenCache {
		if now.After(result.Expires) {
			delete(m.tokenCache, token)
		}
	}
}

// ClearTokenCache elimina un token específico del caché
func (m *AuthMiddleware) ClearTokenCache(tokenString string) {
	m.cacheMutex.Lock()
	defer m.cacheMutex.Unlock()

	delete(m.tokenCache, tokenString)
	m.logger.Debug("Token removed from cache",
		zap.String("token_prefix", tokenString[:min(20, len(tokenString))]))
}

// ClearAllCache limpia todo el caché de tokens
func (m *AuthMiddleware) ClearAllCache() {
	m.cacheMutex.Lock()
	defer m.cacheMutex.Unlock()

	count := len(m.tokenCache)
	m.tokenCache = make(map[string]CachedValidationResult)
	m.logger.Info("All tokens cleared from cache",
		zap.Int("tokens_cleared", count))
}

func (m *AuthMiddleware) setUserContext(c echo.Context, claims jwt.MapClaims) {
	userID, _ := claims["sub"].(string)

	// 1. Poner en Echo context (para compatibilidad)
	c.Set("user_claims", claims)

	// 2. Crear nuevo contexto estándar con toda la información
	ctx := context.Background()
	ctx = context.WithValue(ctx, utils.CtxKeyUserClaims, claims)

	// Información básica del usuario
	if sub, ok := claims["sub"].(string); ok {
		ctx = context.WithValue(ctx, utils.CtxKeyUserID, sub)
		c.Set("user_id", sub)
	}
	if email, ok := claims["email"].(string); ok {
		ctx = context.WithValue(ctx, utils.CtxKeyUserEmail, email)
		c.Set("user_email", email)
	}
	if name, ok := claims["name"].(string); ok {
		ctx = context.WithValue(ctx, utils.CtxKeyUserName, name)
		c.Set("user_name", name)
	}

	// Grupos
	if groups, ok := claims["groups"].([]interface{}); ok {
		var groupStrings []string
		for _, group := range groups {
			if groupStr, ok := group.(string); ok {
				groupStrings = append(groupStrings, groupStr)
			}
		}
		ctx = context.WithValue(ctx, utils.CtxKeyUserGroups, groupStrings)
		c.Set("user_groups", groups)
	}

	// Organización y fábricas

	if organization, ok := claims["organization"]; ok {
		var orgMap map[string]interface{}

		if originalOrg, ok := organization.(map[string]interface{}); ok {
			orgMap = originalOrg
		} else if interfaceOrg, ok := organization.(map[interface{}]interface{}); ok {
			orgMap = convertMiddlewareMap(interfaceOrg)
		}

		if orgMap != nil {
			ctx = context.WithValue(ctx, utils.CtxKeyUserOrganization, orgMap)
			c.Set("user_organization", orgMap)

			var factoryNames []string
			if factories, ok := orgMap["factories"].(map[string]interface{}); ok && factories != nil {
				factoryNames = make([]string, 0, len(factories))
				for factoryName := range factories {
					factoryNames = append(factoryNames, factoryName)
				}
				m.logger.Debug("Factories extracted from JWT",
					zap.Strings("factory_names", factoryNames),
					zap.String("user_id", userID))
			} else {
				factoryNames = []string{}
				m.logger.Warn("User has no factories in JWT",
					zap.String("user_id", userID))
			}
			ctx = context.WithValue(ctx, utils.CtxKeyFactoryNames, factoryNames)
			c.Set("factory_names", factoryNames)
		} else {
			ctx = context.WithValue(ctx, utils.CtxKeyUserOrganization, organization)
			c.Set("user_organization", organization)
		}
	}

	// Siempre establecer factory_names, incluso si no hay organización
	if ctx.Value(utils.CtxKeyFactoryNames) == nil {
		factoryNames := []string{}
		ctx = context.WithValue(ctx, utils.CtxKeyFactoryNames, factoryNames)
		c.Set("factory_names", factoryNames)
		m.logger.Warn("No organization found in JWT, setting empty factory_names",
			zap.String("user_id", userID))
	}

	c.SetRequest(c.Request().WithContext(ctx))
}

// ✅ Función helper para convertir map[interface{}]interface{}
func convertMiddlewareMap(original map[interface{}]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for key, value := range original {
		if strKey, ok := key.(string); ok {
			if nestedMap, ok := value.(map[interface{}]interface{}); ok {
				result[strKey] = convertMiddlewareMap(nestedMap)
			} else if nestedSlice, ok := value.([]interface{}); ok {
				result[strKey] = convertMiddlewareSlice(nestedSlice)
			} else {
				result[strKey] = value
			}
		}
	}
	return result
}

func convertMiddlewareSlice(original []interface{}) []interface{} {
	result := make([]interface{}, len(original))
	for i, item := range original {
		if nestedMap, ok := item.(map[interface{}]interface{}); ok {
			result[i] = convertMiddlewareMap(nestedMap)
		} else {
			result[i] = item
		}
	}
	return result
}

// Funciones helper esenciales que SÍ se usan

func GetUserClaims(c echo.Context) (jwt.MapClaims, error) {
	if claims := c.Get("user_claims"); claims != nil {
		if userClaims, ok := claims.(jwt.MapClaims); ok {
			return userClaims, nil
		}
		return nil, fmt.Errorf("invalid user_claims type in context")
	}
	return nil, fmt.Errorf("user_claims not found in context")
}

func GetUserOrganization(c echo.Context) (map[string]interface{}, error) {
	if org := c.Get("user_organization"); org != nil {
		if organization, ok := org.(map[string]interface{}); ok {
			return organization, nil
		}
		return nil, fmt.Errorf("invalid user_organization type in context")
	}
	return nil, fmt.Errorf("user_organization not found in context")
}

// Middlewares de autorización esenciales

func RequireGroup(group string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			claims, err := GetUserClaims(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "Authentication required")
			}

			groups := extractGroupsFromClaims(claims)
			if !hasGroup(groups, group) {
				return echo.NewHTTPError(http.StatusForbidden,
					"Insufficient permissions. Required group: "+group)
			}

			return next(c)
		}
	}
}

func RequireFactory(factory string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			organization, err := GetUserOrganization(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusForbidden, "Organization information not found")
			}

			if !hasFactoryAccess(organization, factory) {
				return echo.NewHTTPError(http.StatusForbidden,
					"Insufficient permissions. Required factory access: "+factory)
			}

			return next(c)
		}
	}
}

// Helpers internos

func extractGroupsFromClaims(claims jwt.MapClaims) []string {
	var groups []string
	if groupsInterface, ok := claims["groups"].([]interface{}); ok {
		for _, group := range groupsInterface {
			if groupStr, ok := group.(string); ok {
				groups = append(groups, groupStr)
			}
		}
	}
	return groups
}

func hasGroup(groups []string, targetGroup string) bool {
	for _, group := range groups {
		if group == targetGroup {
			return true
		}
	}
	return false
}

func hasFactoryAccess(organization map[string]interface{}, factory string) bool {
	factories, ok := organization["factories"].(map[string]interface{})
	if !ok {
		return false
	}
	_, exists := factories[factory]
	return exists
}
