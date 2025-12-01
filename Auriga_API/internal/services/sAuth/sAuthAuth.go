package sAuth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/remrafvil/Auriga_API/internal/repositories/rModels"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

// ValidateTokenWithClaims valida un token y retorna los claims
func (s *service) ValidateTokenWithClaims(tokenString string) (jwt.MapClaims, error) {
	token, err := s.validator.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*jwt.MapClaims); ok {
		return *claims, nil
	} else if claims, ok := token.Claims.(jwt.MapClaims); ok {
		return claims, nil
	}

	return nil, fmt.Errorf("could not extract claims from token")
}

// GetAuthURL genera la URL de autorización
func (s *service) GetAuthURL(state string) string {
	return s.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// GetAuthURLWithPrompt genera la URL de autorización con prompt específico
func (s *service) GetAuthURLWithPrompt(state string, prompt string) string {
	opts := []oauth2.AuthCodeOption{
		oauth2.AccessTypeOffline,
		oauth2.SetAuthURLParam("prompt", prompt),
	}
	return s.oauthConfig.AuthCodeURL(state, opts...)
}

// GetAuthURLWithMultiplePrompts genera la URL con múltiples prompts
func (s *service) GetAuthURLWithMultiplePrompts(state string, prompts []string) string {
	opts := []oauth2.AuthCodeOption{
		oauth2.AccessTypeOffline,
	}
	// Combinar múltiples prompts con espacio (formato OAuth2: "login select_account")
	promptValue := strings.Join(prompts, " ")
	opts = append(opts, oauth2.SetAuthURLParam("prompt", promptValue))
	// Agregar max_age=0 para invalidar cualquier sesión existente en Authentik
	// Esto fuerza a Authentik a cerrar su sesión y mostrar pantalla de login
	opts = append(opts, oauth2.SetAuthURLParam("max_age", "0"))
	return s.oauthConfig.AuthCodeURL(state, opts...)
}

// GetAuthURLForNewLogin genera URL que fuerza nuevo login y selección de cuenta
// Invalida la sesión de Authentik usando max_age=0
func (s *service) GetAuthURLForNewLogin(state string) string {
	opts := []oauth2.AuthCodeOption{
		oauth2.AccessTypeOffline,
		oauth2.SetAuthURLParam("prompt", "login select_account"),
		// max_age=0 invalida cualquier sesión existente, forzando nuevo login
		oauth2.SetAuthURLParam("max_age", "0"),
	}
	return s.oauthConfig.AuthCodeURL(state, opts...)
}

// GetLogoutURLWithRedirect genera URL de logout que redirige a login con prompts
func (s *service) GetLogoutURLWithRedirect(state string) string {
	// Obtener el issuer (base URL de Authentik)
	issuer := s.config.AuthConfig.Issuer
	jwksEndpoint := s.config.AuthConfig.JWKSEndpoint
	
	// Extraer el slug de la aplicación desde el jwks_endpoint
	slug := "cx-auriga" // Default
	if jwksEndpoint != "" {
		if strings.Contains(jwksEndpoint, "/application/o/") {
			parts := strings.Split(jwksEndpoint, "/application/o/")
			if len(parts) > 1 {
				slugParts := strings.Split(parts[1], "/")
				if len(slugParts) > 0 {
					slug = slugParts[0]
				}
			}
		}
	}
	
	// Asegurarse de que el issuer no termine con /
	issuerBase := issuer
	if len(issuerBase) > 0 && issuerBase[len(issuerBase)-1] == '/' {
		issuerBase = issuerBase[:len(issuerBase)-1]
	}
	
	// Construir la URL del endpoint end-session de Authentik
	endSessionEndpoint := fmt.Sprintf("%s/application/o/%s/end-session/", issuerBase, slug)
	
	// Construir la URL de autorización con prompts que fuerzan nuevo login
	// Esta será la URL a la que redirigir después del logout
	backendLoginURL := "http://18.213.58.26:8081/auth/login?force_new_login=true"
	
	// Crear parámetros para el end-session endpoint
	params := url.Values{}
	params.Set("post_logout_redirect_uri", backendLoginURL)
	
	// Construir la URL completa
	logoutURL := fmt.Sprintf("%s?%s", endSessionEndpoint, params.Encode())
	
	return logoutURL
}

// GetLogoutURLWithFrontendRedirect genera URL de logout que redirige al frontend
func (s *service) GetLogoutURLWithFrontendRedirect(idTokenHint string, frontendRedirectURL string) string {
	issuer := s.config.AuthConfig.Issuer
	jwksEndpoint := s.config.AuthConfig.JWKSEndpoint
	
	// Extraer el slug de la aplicación
	slug := "cx-auriga" // Default
	if jwksEndpoint != "" {
		if strings.Contains(jwksEndpoint, "/application/o/") {
			parts := strings.Split(jwksEndpoint, "/application/o/")
			if len(parts) > 1 {
				slugParts := strings.Split(parts[1], "/")
				if len(slugParts) > 0 {
					slug = slugParts[0]
				}
			}
		}
	}
	
	// Asegurarse de que el issuer no termine con /
	issuerBase := issuer
	if len(issuerBase) > 0 && issuerBase[len(issuerBase)-1] == '/' {
		issuerBase = issuerBase[:len(issuerBase)-1]
	}
	
	// Construir la URL del endpoint end-session de Authentik
	endSessionEndpoint := fmt.Sprintf("%s/application/o/%s/end-session/", issuerBase, slug)
	
	// Crear parámetros para el end-session endpoint
	params := url.Values{}
	params.Set("post_logout_redirect_uri", frontendRedirectURL)
	
	// Si tenemos id_token, agregarlo como hint (ayuda a Authentik a cerrar la sesión correcta)
	if idTokenHint != "" {
		params.Set("id_token_hint", idTokenHint)
	}
	
	// Construir la URL completa
	logoutURL := fmt.Sprintf("%s?%s", endSessionEndpoint, params.Encode())
	
	return logoutURL
}

// GetLogoutURL genera la URL de logout de Authentik
// Authentik usa el endpoint end-session de OIDC para cerrar sesión
func (s *service) GetLogoutURL(idTokenHint string) string {
	// Construir URL de logout de Authentik
	// El formato correcto en Authentik es: {base_url}/application/o/{slug}/end-session/
	// El slug se puede extraer del jwks_endpoint o del issuer
	
	issuer := s.config.AuthConfig.Issuer
	jwksEndpoint := s.config.AuthConfig.JWKSEndpoint
	
	// Extraer el slug de la aplicación desde el jwks_endpoint
	// Formato: http://host:port/application/o/{slug}/jwks/
	slug := "cx-auriga" // Default, pero intentar extraerlo
	if jwksEndpoint != "" {
		// Intentar extraer el slug del jwks_endpoint
		// Ejemplo: http://18.232.248.24:38006/application/o/cx-auriga/jwks/
		if strings.Contains(jwksEndpoint, "/application/o/") {
			parts := strings.Split(jwksEndpoint, "/application/o/")
			if len(parts) > 1 {
				slugParts := strings.Split(parts[1], "/")
				if len(slugParts) > 0 {
					slug = slugParts[0]
				}
			}
		}
	}
	
	// Asegurarse de que el issuer no termine con /
	issuerBase := issuer
	if len(issuerBase) > 0 && issuerBase[len(issuerBase)-1] == '/' {
		issuerBase = issuerBase[:len(issuerBase)-1]
	}
	
	// Construir URL de logout: {base_url}/application/o/{slug}/end-session/
	logoutURL := issuerBase + "/application/o/" + slug + "/end-session/"
	
	// Construir parámetros de query
	params := make(map[string]string)
	
	// post_logout_redirect_uri: URL a la que redirigir después del logout
	// Esta debe estar registrada en Authentik como URL de logout permitida
	// Agregar parámetros de error para que el frontend muestre el mensaje
	postLogoutRedirectURI := "http://18.213.58.26:5826/login?error=account_disabled&message=" + 
		url.QueryEscape("Your account has been disabled. Please contact your administrator.")
	params["post_logout_redirect_uri"] = postLogoutRedirectURI
	
	// id_token_hint: Token para identificar la sesión (opcional pero recomendado)
	// Esto ayuda a Authentik a identificar qué sesión cerrar
	if idTokenHint != "" {
		params["id_token_hint"] = idTokenHint
	}
	
	// Construir query string con encoding URL
	queryValues := url.Values{}
	for key, value := range params {
		queryValues.Set(key, value)
	}
	
	queryString := queryValues.Encode()
	if queryString != "" {
		logoutURL += "?" + queryString
	}
	
	s.logger.Debug("Generated Authentik logout URL",
		zap.String("logout_url", logoutURL),
		zap.String("post_logout_redirect_uri", postLogoutRedirectURI),
		zap.Bool("has_id_token_hint", idTokenHint != ""))
	
	return logoutURL
}

// GetLogoutURLToAuthentikOverview genera URL de logout que redirige a la vista general de Authentik
// Esto permite al usuario seleccionar qué aplicación iniciar (cx-auriga, paperless, etc.)
func (s *service) GetLogoutURLToAuthentikOverview(idTokenHint string) string {
	issuer := s.config.AuthConfig.Issuer
	jwksEndpoint := s.config.AuthConfig.JWKSEndpoint
	
	// Extraer el slug de la aplicación
	slug := "cx-auriga" // Default
	if jwksEndpoint != "" {
		if strings.Contains(jwksEndpoint, "/application/o/") {
			parts := strings.Split(jwksEndpoint, "/application/o/")
			if len(parts) > 1 {
				slugParts := strings.Split(parts[1], "/")
				if len(slugParts) > 0 {
					slug = slugParts[0]
				}
			}
		}
	}
	
	// Asegurarse de que el issuer no termine con /
	issuerBase := issuer
	if len(issuerBase) > 0 && issuerBase[len(issuerBase)-1] == '/' {
		issuerBase = issuerBase[:len(issuerBase)-1]
	}
	
	// Construir la URL del endpoint end-session de Authentik
	endSessionEndpoint := fmt.Sprintf("%s/application/o/%s/end-session/", issuerBase, slug)
	
	// La vista general de Authentik está típicamente en:
	// - /if/flow/default-authenticator-static/ (para el flujo de autenticación estático)
	// - /if/ (raíz de la interfaz de flujo)
	// - O simplemente la raíz del issuer
	// Usamos la raíz del issuer que normalmente redirige a la vista general
	authentikOverviewURL := issuerBase + "/"
	
	// Crear parámetros para el end-session endpoint
	params := url.Values{}
	params.Set("post_logout_redirect_uri", authentikOverviewURL)
	
	// Si tenemos id_token, agregarlo como hint
	if idTokenHint != "" {
		params.Set("id_token_hint", idTokenHint)
	}
	
	// Construir la URL completa
	logoutURL := fmt.Sprintf("%s?%s", endSessionEndpoint, params.Encode())
	
	s.logger.Debug("Generated Authentik logout URL to overview",
		zap.String("logout_url", logoutURL),
		zap.String("post_logout_redirect_uri", authentikOverviewURL),
		zap.Bool("has_id_token_hint", idTokenHint != ""))
	
	return logoutURL
}

// ExchangeCode intercambia el código por tokens
func (s *service) ExchangeCode(ctx context.Context, code string) (*oauth2.Token, error) {
	return s.oauthConfig.Exchange(ctx, code)
}

// GetUserInfo obtiene la información del usuario desde Authentik
func (s *service) GetUserInfo(ctx context.Context, token *oauth2.Token) (*rModels.AuthentikUserInfo, error) {
	client := s.oauthConfig.Client(ctx, token)

	userInfoURL := s.config.AuthConfig.Issuer + "/application/o/userinfo/"
	resp, err := client.Get(userInfoURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("userinfo endpoint returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var userInfo rModels.AuthentikUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, fmt.Errorf("failed to unmarshal user info: %w", err)
	}

	return &userInfo, nil
}

// SyncUser sincroniza el usuario con la tabla MrEmployee
func (s *service) SyncUser(userInfo *rModels.AuthentikUserInfo) (*rModels.MrEmployee, error) {
	employee, err := s.repository.SyncUser(userInfo)
	if err != nil {
		return nil, err
	}

	// LOG REDUCIDO: Solo información esencial
	s.logger.Info("Employee synchronized",
		zap.String("authentik_id", userInfo.Sub),
		zap.Uint("employee_id", employee.ID),
		zap.String("email", employee.Email))

	return employee, nil
}

// FindCurrentUserInfo - Buscar empleado por ID de Authentik
func (s *service) FindCurrentUserInfo(userID string, ctx context.Context) (*rModels.MrEmployee, error) {
	employee, _, err := s.GetEmployeeWithOrganization(userID, ctx)
	return employee, err
}

// Nuevo método que combina empleado BD + organización del JWT (sin caché)
func (s *service) GetEmployeeWithOrganization(userID string, ctx context.Context) (*rModels.MrEmployee, map[string]interface{}, error) {
	// Obtener empleado de la base de datos directamente (sin caché)
	employee, err := s.repository.FindCurrentUserInfo(userID, ctx)
	if err != nil {
		return nil, nil, err
	}

	// La organización viene del JWT, no de la BD
	organization := make(map[string]interface{})

	// LOG REDUCIDO: Solo en caso de error o para información importante
	if employee == nil {
		s.logger.Warn("Employee not found in database", zap.String("user_id", userID))
	}

	return employee, organization, nil
}

// ValidateToken valida un token usando el validador local
func (s *service) ValidateToken(tokenString string) (*jwt.Token, error) {
	return s.validator.ValidateToken(tokenString)
}

// GetValidator retorna el validador JWKS para operaciones administrativas
func (s *service) GetValidator() *JWKSValidator {
	return s.validator
}

// ForceRefreshJWKS fuerza la actualización de las claves JWKS
func (s *service) ForceRefreshJWKS() error {
	return s.validator.ForceRefresh()
}

// Métodos de gestión de tokens
func (s *service) AddToBlacklist(token string, expiresAt time.Time) {
	s.blacklist.Add(token, expiresAt)
	// LOG REDUCIDO: Solo información importante
	s.logger.Info("Token added to blacklist", zap.Time("expires_at", expiresAt))
}

func (s *service) IsTokenRevoked(token string) bool {
	return s.blacklist.IsRevoked(token)
}

func (s *service) ClearUserCache(userID string) {
	// Método mantenido por compatibilidad, pero no hace nada
	// LOG ELIMINADO: No es necesario loggear esta operación ahora
}

func (s *service) CleanupBlacklist() {
	s.blacklist.Cleanup()
}
