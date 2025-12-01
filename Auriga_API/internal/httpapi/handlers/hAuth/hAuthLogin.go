package hAuth

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

// Función helper para limpiar cookies - MEJORADA para limpiar todas las variaciones
func (h *handler) cleanupCookies(c echo.Context) {
	// Lista completa de cookies a limpiar
	cookies := []string{
		"auth_token",
		"user_data",
		"session_active",
		// Variaciones posibles con diferentes paths y dominios
	}
	
	// Limpiar cookies con diferentes configuraciones para asegurar eliminación completa
	for _, cookieName := range cookies {
		// Configuración 1: Path raíz, sin dominio
		cookie1 := &http.Cookie{
			Name:     cookieName,
			Value:    "",
			Path:     "/",
			HttpOnly: cookieName == "auth_token",
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   -1,
			Expires:  time.Now().Add(-time.Hour * 24),
		}
		c.SetCookie(cookie1)
		
		// Configuración 2: Path raíz, con dominio vacío (por si acaso)
		cookie2 := &http.Cookie{
			Name:     cookieName,
			Value:    "",
			Path:     "/",
			Domain:   "",
			HttpOnly: cookieName == "auth_token",
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   -1,
			Expires:  time.Now().Add(-time.Hour * 24),
		}
		c.SetCookie(cookie2)
	}
}

// internal/server/server.go

func (h *handler) logoutHandler(c echo.Context) error {
	userID, userEmail, _, _, _ := getUserInfoFromContext(c)

	// 1. Obtener token para revocación
	cookie, err := c.Cookie("auth_token")
	var tokenString string
	var idTokenHint string
	if err == nil && cookie.Value != "" {
		tokenString = cookie.Value

		// 2. Intentar obtener ID token si está disponible (para logout de Authentik)
		// El ID token puede estar en el access_token o en una cookie separada
		claims, err := getUserClaimsFromContext(c)
		if err == nil {
			// Usar el access_token como id_token_hint si está disponible
			idTokenHint = tokenString
			
			// Calcular expiración
			expiresAt := time.Now().Add(24 * time.Hour) // Default
			if expUnix, ok := claims["exp"].(float64); ok {
				expiresAt = time.Unix(int64(expUnix), 0)
			}

			// 3. Agregar a blacklist
			h.service.AddToBlacklist(tokenString, expiresAt)
		}
		
		// 4. Limpiar caché de tokens validados del middleware
		if h.authMiddleware != nil {
			h.authMiddleware.ClearTokenCache(tokenString)
		}
	}

	// 5. Limpiar cookies (incluyendo todas las posibles variaciones)
	h.cleanupCookies(c)

	h.logger.Info("User logged out locally",
		zap.String("user_id", userID),
		zap.String("email", userEmail),
		zap.Bool("token_revoked", tokenString != ""),
		zap.Bool("cache_cleared", tokenString != ""))

	// 6. Redirigir a Authentik para cerrar sesión allí también
	// Construir URL de logout de Authentik
	authentikLogoutURL := h.service.GetLogoutURL(idTokenHint)
	
	// Si es una petición AJAX/JSON, retornar la URL de logout
	if c.Request().Header.Get("Accept") == "application/json" || 
	   c.QueryParam("format") == "json" {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message":       "Logged out successfully",
			"token_revoked": tokenString != "",
			"cache_cleared": tokenString != "",
			"user_id":       userID,
			"logout_url":    authentikLogoutURL,
			"redirect":      true,
		})
	}

	// Redirigir a Authentik para cerrar sesión
	return c.Redirect(http.StatusFound, authentikLogoutURL)
}

/* func (h *handler) profileHandler(c echo.Context) error {
	userID, userEmail, userName, userGroups, organization := getUserInfoFromContext(c)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user_id":      userID,
		"email":        userEmail,
		"name":         userName,
		"groups":       userGroups,
		"organization": organization,
		"message":      "This is your profile - validated locally!",
		"timestamp":    time.Now().Format(time.RFC3339),
	})
} */

func (h *handler) getCurrentUserHandler(c echo.Context) error {
	userID, userEmail, userName, userGroups, organization := getUserInfoFromContext(c)

	employee, err := h.service.FindCurrentUserInfo(userID, c.Request().Context())
	if err != nil {
		// LOG REDUCIDO: Solo loggear errores reales
		h.logger.Warn("Employee not found in database",
			zap.String("user_id", userID),
			zap.Error(err))
		return echo.NewHTTPError(http.StatusNotFound, "Employee not found")
	}

	// Obtener roles de Authentik desde la base de datos
	var dbRoles []map[string]interface{}
	for _, role := range employee.AuthentikRoles {
		dbRoles = append(dbRoles, map[string]interface{}{
			"factory":     role.Factory,
			"department":  role.Department,
			"role":        role.Role,
			"assigned_at": role.AssignedAt.Format(time.RFC3339),
			"is_active":   role.IsActive,
		})
	}

	// Obtener información de factories y roles desde JWT (para comparación)
	factories := getUserFactories(organization)
	var userFactories []map[string]interface{}

	for factoryName, factoryData := range factories {
		if factoryMap, ok := factoryData.(map[string]interface{}); ok {
			if deptData, ok := factoryMap["departments"].(map[string]interface{}); ok {
				for deptName, deptInfo := range deptData {
					if deptMap, ok := deptInfo.(map[string]interface{}); ok {
						if rolesInterface, ok := deptMap["roles"].([]interface{}); ok {
							var roles []string
							for _, role := range rolesInterface {
								if roleStr, ok := role.(string); ok {
									roles = append(roles, roleStr)
								}
							}
							userFactories = append(userFactories, map[string]interface{}{
								"factory":    factoryName,
								"department": deptName,
								"roles":      roles,
							})
						}
					}
				}
			}
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"employee":    employee,
		"auth_method": "local_jwt_validation",
		"organization": map[string]interface{}{
			"name":          getOrganizationName(organization),
			"workday_id":    getWorkdayID(organization),
			"idn":           getIDCard(organization), // Nota: getIDCard ahora devuelve idn
			"status":        getEmployeeStatus(organization),
			"departamento":  getDepartment(organization),
			"cargo":         getPosition(organization),
			"tipo_empleado": getEmployeeType(organization),
			"factories":     userFactories,
		},
		"authentik_roles": map[string]interface{}{
			"from_jwt": userFactories,
			"from_db":  dbRoles,
			"count":    len(dbRoles),
		},
		"from_context": map[string]interface{}{
			"user_id": userID,
			"email":   userEmail,
			"name":    userName,
			"groups":  userGroups,
		},
		"cache_info": map[string]interface{}{
			"from_cache": false,
			"source":     "jwt_context",
		},
	})
}

func (h *handler) protectedDataHandler(c echo.Context) error {
	userID, userEmail, userName, userGroups, organization := getUserInfoFromContext(c)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":           "This is protected data",
		"user_id":           userID,
		"email":             userEmail,
		"name":              userName,
		"groups":            userGroups,
		"organization":      organization,
		"data":              "Sensitive information here",
		"validated_locally": true,
		"timestamp":         time.Now().Format(time.RFC3339),
	})
}

func (h *handler) tokenInfoHandler(c echo.Context) error {
	claims, err := getUserClaimsFromContext(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	// Extraer información directamente
	userID, _ := claims["sub"].(string)
	email, _ := claims["email"].(string)
	name, _ := claims["name"].(string)
	organization, _ := claims["organization"].(map[string]interface{})

	// Extraer tiempos
	var issuedAt, expiresAt string
	var isExpired bool
	var expiresIn string

	if expUnix, ok := claims["exp"].(float64); ok {
		expTime := time.Unix(int64(expUnix), 0)
		expiresAt = expTime.Format(time.RFC3339)
		isExpired = time.Now().After(expTime)
		expiresIn = time.Until(expTime).Round(time.Second).String()
	}

	if iatUnix, ok := claims["iat"].(float64); ok {
		iatTime := time.Unix(int64(iatUnix), 0)
		issuedAt = iatTime.Format(time.RFC3339)
	}

	response := map[string]interface{}{
		"user": map[string]interface{}{
			"id":           userID,
			"email":        email,
			"name":         name,
			"organization": organization,
		},
		"token": map[string]interface{}{
			"issued_at":  issuedAt,
			"expires_at": expiresAt,
			"expires_in": expiresIn,
			"is_expired": isExpired,
		},
	}

	return c.JSON(http.StatusOK, response)
}

/* func (h *handler) debugTokenHandler(c echo.Context) error {
	cookie, err := c.Cookie("auth_token")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "No token cookie"})
	}

	// Solo mostrar información básica sin parsing complejo
	debugInfo := map[string]interface{}{
		"token_length": len(cookie.Value),
		"has_token":    cookie.Value != "",
	}

	// Intentar parsing simple solo si es necesario
	if len(cookie.Value) > 0 {
		// Dividir el token en partes para análisis básico
		parts := strings.Split(cookie.Value, ".")
		if len(parts) == 3 {
			debugInfo["token_parts"] = len(parts)

			// Decodificar header
			if headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0]); err == nil {
				var header map[string]interface{}
				if json.Unmarshal(headerBytes, &header) == nil {
					debugInfo["header"] = header
				}
			}

			// Decodificar payload para información básica
			if payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1]); err == nil {
				var payload map[string]interface{}
				if json.Unmarshal(payloadBytes, &payload) == nil {
					// Solo incluir información no sensible
					safePayload := map[string]interface{}{
						"sub":          payload["sub"],
						"iss":          payload["iss"],
						"exp":          payload["exp"],
						"iat":          payload["iat"],
						"email":        payload["email"],
						"name":         payload["name"],
						"groups":       payload["groups"],
						"organization": payload["organization"],
					}
					debugInfo["payload"] = safePayload
				}
			}
		}
	}

	return c.JSON(http.StatusOK, debugInfo)
} */

func generateState() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// Handler para ver los grupos y la organización del usuario - ACTUALIZADO
func (h *handler) myGroupsHandler(c echo.Context) error {
	userID, userEmail, _, userGroups, organization := getUserInfoFromContext(c)

	// Obtener resumen completo de la organización
	orgSummary := getOrganizationSummary(organization)

	// Obtener información detallada de factories y roles
	groupedRoles := getUserRolesGrouped(organization)
	allRoles := getAllUserRoles(organization)

	// Verificar si hay fábricas asignadas
	factories := getUserFactories(organization)
	hasFactories := factories != nil && len(factories) > 0

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user_id": userID,
		"email":   userEmail,
		"groups":  userGroups,

		// Información de organización - ACTUALIZADA CON NUEVOS CAMPOS
		"organization_summary": orgSummary,

		// Estructura detallada
		"organization_structure": map[string]interface{}{
			"name":            getOrganizationName(organization),
			"workday_id":      getWorkdayID(organization),
			"id_card":         getIDCard(organization),
			"status":          getEmployeeStatus(organization),
			"departamento":    getDepartment(organization),
			"cargo":           getPosition(organization),
			"tipo_empleado":   getEmployeeType(organization),
			"factories":       groupedRoles,
			"has_factories":   hasFactories,
			"factories_count": len(getUserFactoryNames(organization)),
		},

		// Lista plana de todos los roles
		"all_roles": allRoles,

		// Estadísticas
		"stats": map[string]interface{}{
			"factories_count":   len(getUserFactoryNames(organization)),
			"departments_count": len(getAllDepartments(organization)),
			"total_roles":       len(allRoles),
			"has_assignments":   hasFactories && len(allRoles) > 0,
		},

		// Información de estado
		"status": map[string]interface{}{
			"organization_detected": organization != nil,
			"has_factories":         hasFactories,
			"has_roles":             len(allRoles) > 0,
			"message":               getOrganizationStatusMessage(organization),
		},

		// Accesos generales
		"has_admin_access":   hasGroup(userGroups, "authentik Admins"),
		"has_grafana_access": hasGroup(userGroups, "Grafana Admins") || hasGroup(userGroups, "Grafana Editors"),
		"timestamp":          time.Now().Format(time.RFC3339),
	})
}

// Función helper adicional para obtener todos los departamentos únicos
func getAllDepartments(organization map[string]interface{}) []string {
	var departments []string
	seen := make(map[string]bool)

	groupedRoles := getUserRolesGrouped(organization)
	for _, item := range groupedRoles {
		if dept, ok := item["department"].(string); ok {
			if !seen[dept] {
				seen[dept] = true
				departments = append(departments, dept)
			}
		}
	}

	return departments
}

// Handler solo para administradores de Authentik
func (h *handler) adminStatsHandler(c echo.Context) error {
	userID, userEmail, userName, _, organization := getUserInfoFromContext(c)

	// LOG REDUCIDO: Solo información esencial
	h.logger.Info("Admin stats accessed",
		zap.String("user_id", userID),
		zap.String("email", userEmail))

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Welcome to Admin Dashboard",
		"user": map[string]interface{}{
			"id":           userID,
			"email":        userEmail,
			"name":         userName,
			"organization": getOrganizationName(organization),
		},
		"stats": map[string]interface{}{
			"total_users":  150,
			"active_today": 45,
			"api_requests": 1250,
		},
		"accessible_to": "authentik Admins only",
	})
}

// Handler que requiere ambos grupos
func (h *handler) superAdminHandler(c echo.Context) error {
	userID, userEmail, userName, userGroups, organization := getUserInfoFromContext(c)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Super Admin System Information",
		"user": map[string]interface{}{
			"id":           userID,
			"email":        userEmail,
			"name":         userName,
			"organization": getOrganizationName(organization),
		},
		"system_info": map[string]interface{}{
			"server_uptime":   "15 days, 4 hours",
			"memory_usage":    "68%",
			"active_sessions": 23,
			"database_size":   "2.4 GB",
		},
		"required_groups": []string{"authentik Admins", "Grafana Admins"},
		"user_has_groups": userGroups,
	})
}

// Función helper para verificar grupo
func hasGroup(groups []string, targetGroup string) bool {
	for _, group := range groups {
		if group == targetGroup {
			return true
		}
	}
	return false
}

