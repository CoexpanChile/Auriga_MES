package middlewares

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
)

// PermissionConfig define los requisitos de permisos para una ruta
type PermissionConfig struct {
	Factory    string   // Fábrica requerida (opcional)
	Department string   // Departamento requerido (opcional)
	Roles      []string // Roles requeridos (al menos uno)
	Groups     []string // Grupos requeridos (opcional)
	Any        bool     // Si true, requiere cualquiera de los permisos. Si false, requiere todos
}

// RequirePermission crea un middleware que verifica permisos basados en factory, department y roles
func RequirePermission(config PermissionConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			claims, err := GetUserClaims(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "Authentication required")
			}

			organization, err := GetUserOrganization(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusForbidden, "Organization information not found")
			}

			// Verificar grupos si se especificaron
			if len(config.Groups) > 0 {
				groups := extractGroupsFromClaims(claims)
				hasGroup := false
				for _, requiredGroup := range config.Groups {
					if hasGroupInList(groups, requiredGroup) {
						hasGroup = true
						break
					}
				}
				if !hasGroup {
					return echo.NewHTTPError(http.StatusForbidden,
						fmt.Sprintf("Insufficient permissions. Required one of groups: %v", config.Groups))
				}
			}

			// Si no se especificó factory ni department, solo verificar grupos
			if config.Factory == "" && config.Department == "" && len(config.Roles) == 0 {
				return next(c)
			}

			// Verificar acceso a fábrica si se especificó
			if config.Factory != "" {
				if !hasFactoryAccess(organization, config.Factory) {
					return echo.NewHTTPError(http.StatusForbidden,
						fmt.Sprintf("Insufficient permissions. Required factory access: %s", config.Factory))
				}
			}

			// Verificar roles si se especificaron
			if len(config.Roles) > 0 {
				userRoles := getUserRolesFromOrganization(organization, config.Factory, config.Department)
				
				if config.Any {
					// Requiere al menos uno de los roles
					hasAnyRole := false
					for _, requiredRole := range config.Roles {
						if hasRoleInList(userRoles, requiredRole) {
							hasAnyRole = true
							break
						}
					}
					if !hasAnyRole {
						return echo.NewHTTPError(http.StatusForbidden,
							fmt.Sprintf("Insufficient permissions. Required one of roles: %v", config.Roles))
					}
				} else {
					// Requiere todos los roles
					for _, requiredRole := range config.Roles {
						if !hasRoleInList(userRoles, requiredRole) {
							return echo.NewHTTPError(http.StatusForbidden,
								fmt.Sprintf("Insufficient permissions. Required role: %s", requiredRole))
						}
					}
				}
			}

			return next(c)
		}
	}
}

// RequireRole crea un middleware que verifica un rol específico en cualquier factory/department
func RequireRole(role string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			organization, err := GetUserOrganization(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusForbidden, "Organization information not found")
			}

			allRoles := getAllUserRoles(organization)
			hasRole := false
			for _, userRole := range allRoles {
				if roleMap, ok := userRole.(map[string]interface{}); ok {
					if roleStr, ok := roleMap["role"].(string); ok && roleStr == role {
						hasRole = true
						break
					}
				}
			}

			if !hasRole {
				return echo.NewHTTPError(http.StatusForbidden,
					fmt.Sprintf("Insufficient permissions. Required role: %s", role))
			}

			return next(c)
		}
	}
}

// RequireFactoryAndRole crea un middleware que verifica acceso a una fábrica y un rol específico
func RequireFactoryAndRole(factory, role string) echo.MiddlewareFunc {
	return RequirePermission(PermissionConfig{
		Factory: factory,
		Roles:   []string{role},
		Any:     false,
	})
}

// RequireFactoryDepartmentAndRole crea un middleware que verifica factory, department y rol
func RequireFactoryDepartmentAndRole(factory, department, role string) echo.MiddlewareFunc {
	return RequirePermission(PermissionConfig{
		Factory:    factory,
		Department: department,
		Roles:      []string{role},
		Any:        false,
	})
}

// Helpers internos

func getUserRolesFromOrganization(organization map[string]interface{}, factory, department string) []string {
	var roles []string

	if organization == nil {
		return roles
	}

	factories, ok := organization["factories"].(map[string]interface{})
	if !ok {
		return roles
	}

	// Si se especificó una fábrica, buscar solo en esa fábrica
	if factory != "" {
		if factoryData, ok := factories[factory].(map[string]interface{}); ok {
			if deptData, ok := factoryData["departments"].(map[string]interface{}); ok {
				// Si se especificó un departamento, buscar solo en ese departamento
				if department != "" {
					if deptInfo, ok := deptData[department].(map[string]interface{}); ok {
						if rolesInterface, ok := deptInfo["roles"].([]interface{}); ok {
							for _, role := range rolesInterface {
								if roleStr, ok := role.(string); ok {
									roles = append(roles, roleStr)
								}
							}
						}
					}
				} else {
					// Buscar en todos los departamentos de la fábrica
					for _, deptInfo := range deptData {
						if deptMap, ok := deptInfo.(map[string]interface{}); ok {
							if rolesInterface, ok := deptMap["roles"].([]interface{}); ok {
								for _, role := range rolesInterface {
									if roleStr, ok := role.(string); ok {
										roles = append(roles, roleStr)
									}
								}
							}
						}
					}
				}
			}
		}
	} else {
		// Buscar en todas las fábricas
		for _, factoryData := range factories {
			if factoryMap, ok := factoryData.(map[string]interface{}); ok {
				if deptData, ok := factoryMap["departments"].(map[string]interface{}); ok {
					for _, deptInfo := range deptData {
						if deptMap, ok := deptInfo.(map[string]interface{}); ok {
							if rolesInterface, ok := deptMap["roles"].([]interface{}); ok {
								for _, role := range rolesInterface {
									if roleStr, ok := role.(string); ok {
										roles = append(roles, roleStr)
									}
								}
							}
						}
					}
				}
			}
		}
	}

	return roles
}

func getAllUserRoles(organization map[string]interface{}) []interface{} {
	var allRoles []interface{}

	if organization == nil {
		return allRoles
	}

	factories, ok := organization["factories"].(map[string]interface{})
	if !ok {
		return allRoles
	}

	for factoryName, factoryData := range factories {
		if factoryMap, ok := factoryData.(map[string]interface{}); ok {
			if deptData, ok := factoryMap["departments"].(map[string]interface{}); ok {
				for deptName, deptInfo := range deptData {
					if deptMap, ok := deptInfo.(map[string]interface{}); ok {
						if rolesInterface, ok := deptMap["roles"].([]interface{}); ok {
							for _, role := range rolesInterface {
								if roleStr, ok := role.(string); ok {
									allRoles = append(allRoles, map[string]interface{}{
										"factory":    factoryName,
										"department": deptName,
										"role":       roleStr,
									})
								}
							}
						}
					}
				}
			}
		}
	}

	return allRoles
}

func hasRoleInList(roles []string, targetRole string) bool {
	for _, role := range roles {
		if role == targetRole {
			return true
		}
	}
	return false
}

func hasGroupInList(groups []string, targetGroup string) bool {
	for _, group := range groups {
		if group == targetGroup {
			return true
		}
	}
	return false
}


