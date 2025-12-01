package utils

import (
	"context"
	"fmt"

	"github.com/labstack/echo/v4"
)

// GetUserIDFromContext obtiene userID de cualquier contexto (Echo o estándar)
func GetUserIDFromContext(ctx context.Context) (string, error) {
	// Si es contexto de Echo
	if echoCtx, ok := ctx.(echo.Context); ok {
		if userID := echoCtx.Get("user_id"); userID != nil {
			return userID.(string), nil
		}
		return "", fmt.Errorf("user_id not found in Echo context")
	}

	// Si es contexto estándar, buscar en valores
	if userID, ok := GetUserID(ctx); ok {
		return userID, nil
	}

	return "", fmt.Errorf("user_id not found in context")
}

// GetUserEmailFromContext obtiene email del contexto
func GetUserEmailFromContext(ctx context.Context) (string, error) {
	if echoCtx, ok := ctx.(echo.Context); ok {
		if email := echoCtx.Get("user_email"); email != nil {
			return email.(string), nil
		}
		return "", fmt.Errorf("user_email not found in Echo context")
	}

	if email, ok := GetUserEmail(ctx); ok {
		return email, nil
	}

	return "", fmt.Errorf("user_email not found in context")
}

// GetUserGroupsFromContext obtiene grupos del contexto
func GetUserGroupsFromContext(ctx context.Context) ([]string, error) {
	var groups []string

	if echoCtx, ok := ctx.(echo.Context); ok {
		if groupsInterface := echoCtx.Get("user_groups"); groupsInterface != nil {
			if groupSlice, ok := groupsInterface.([]interface{}); ok {
				for _, group := range groupSlice {
					if groupStr, ok := group.(string); ok {
						groups = append(groups, groupStr)
					}
				}
				return groups, nil
			}
		}
		return nil, fmt.Errorf("user_groups not found in Echo context")
	}

	if groups, ok := GetUserGroups(ctx); ok {
		return groups, nil
	}

	return nil, fmt.Errorf("user_groups not found in context")
}

// HasGroup verifica si el usuario tiene un grupo específico
func HasGroup(ctx context.Context, targetGroup string) (bool, error) {
	groups, err := GetUserGroupsFromContext(ctx)
	if err != nil {
		return false, err
	}

	for _, group := range groups {
		if group == targetGroup {
			return true, nil
		}
	}
	return false, nil
}
