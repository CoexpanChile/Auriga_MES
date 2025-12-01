package hAuth

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

// Handler para obtener los permisos del usuario actual
func (h *handler) permissionsHandler(c echo.Context) error {
	userID, userEmail, userName, userGroups, organization := getUserInfoFromContext(c)

	if organization == nil {
		h.logger.Warn("User has no organization information",
			zap.String("user_id", userID))
		return c.JSON(http.StatusOK, map[string]interface{}{
			"user": map[string]interface{}{
				"id":     userID,
				"email":  userEmail,
				"name":   userName,
				"groups": userGroups,
			},
			"permissions": map[string]interface{}{
				"factories":    []string{},
				"departments":  []string{},
				"roles":        []string{},
				"all_roles":    []map[string]interface{}{},
				"has_access":   false,
			},
		})
	}

	// Extraer información de permisos
	factories := getUserFactoryNames(organization)
	allRoles := getAllUserRoles(organization)
	groupedRoles := getUserRolesGrouped(organization)

	// Crear lista de roles únicos
	uniqueRoles := make(map[string]bool)
	var rolesList []string
	for _, roleData := range allRoles {
		if roleStr, ok := roleData["role"].(string); ok {
			if !uniqueRoles[roleStr] {
				uniqueRoles[roleStr] = true
				rolesList = append(rolesList, roleStr)
			}
		}
	}

	// Extraer departamentos únicos
	uniqueDepartments := make(map[string]bool)
	var departmentsList []string
	for _, roleData := range allRoles {
		if deptStr, ok := roleData["department"].(string); ok {
			if !uniqueDepartments[deptStr] {
				uniqueDepartments[deptStr] = true
				departmentsList = append(departmentsList, deptStr)
			}
		}
	}

	// Información de organización
	orgSummary := getOrganizationSummary(organization)

	h.logger.Debug("User permissions retrieved",
		zap.String("user_id", userID),
		zap.Int("factories_count", len(factories)),
		zap.Int("roles_count", len(rolesList)))

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"id":     userID,
			"email":  userEmail,
			"name":   userName,
			"groups": userGroups,
		},
		"organization": orgSummary,
		"permissions": map[string]interface{}{
			"factories":    factories,
			"departments":  departmentsList,
			"roles":        rolesList,
			"all_roles":    allRoles,
			"grouped_roles": groupedRoles,
			"has_access":   len(factories) > 0 && len(rolesList) > 0,
		},
	})
}

// Handler para verificar si el usuario tiene un permiso específico
func (h *handler) checkPermissionHandler(c echo.Context) error {
	factory := c.QueryParam("factory")
	department := c.QueryParam("department")
	role := c.QueryParam("role")
	group := c.QueryParam("group")

	userID, _, _, userGroups, organization := getUserInfoFromContext(c)

	if organization == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"has_permission": false,
			"reason":         "No organization information found",
		})
	}

	hasPermission := true
	reasons := []string{}

	// Verificar grupo si se especificó
	if group != "" {
		hasGroup := false
		for _, userGroup := range userGroups {
			if userGroup == group {
				hasGroup = true
				break
			}
		}
		if !hasGroup {
			hasPermission = false
			reasons = append(reasons, "User is not in required group: "+group)
		}
	}

	// Verificar fábrica si se especificó
	if factory != "" {
		if !hasFactoryAccess(organization, factory) {
			hasPermission = false
			reasons = append(reasons, "User does not have access to factory: "+factory)
		}
	}

	// Verificar rol si se especificó
	if role != "" {
		userRoles := getUserRoles(organization, factory, department)
		hasRole := false
		for _, userRole := range userRoles {
			if userRole == role {
				hasRole = true
				break
			}
		}
		if !hasRole {
			hasPermission = false
			reasons = append(reasons, "User does not have required role: "+role)
		}
	}

	h.logger.Debug("Permission check",
		zap.String("user_id", userID),
		zap.String("factory", factory),
		zap.String("department", department),
		zap.String("role", role),
		zap.Bool("has_permission", hasPermission))

	return c.JSON(http.StatusOK, map[string]interface{}{
		"has_permission": hasPermission,
		"reasons":        reasons,
		"checked": map[string]interface{}{
			"factory":    factory,
			"department": department,
			"role":       role,
			"group":      group,
		},
	})
}


