package utils

import "context"

// Context keys - tipos personalizados para evitar colisiones (SA1029)
// Usando el tipo contextKey que ya existe en logger.go
const (
	CtxKeyUserClaims      contextKey = "user_claims"
	CtxKeyUserID          contextKey = "user_id"
	CtxKeyUserEmail       contextKey = "user_email"
	CtxKeyUserName        contextKey = "user_name"
	CtxKeyUserGroups      contextKey = "user_groups"
	CtxKeyUserOrganization contextKey = "user_organization"
	CtxKeyFactoryNames    contextKey = "factory_names"
)

// Helper functions para obtener valores del contexto de forma segura
func GetUserID(ctx context.Context) (string, bool) {
	value := ctx.Value(CtxKeyUserID)
	if value == nil {
		return "", false
	}
	userID, ok := value.(string)
	return userID, ok
}

func GetUserName(ctx context.Context) (string, bool) {
	value := ctx.Value(CtxKeyUserName)
	if value == nil {
		return "", false
	}
	userName, ok := value.(string)
	return userName, ok
}

func GetUserEmail(ctx context.Context) (string, bool) {
	value := ctx.Value(CtxKeyUserEmail)
	if value == nil {
		return "", false
	}
	email, ok := value.(string)
	return email, ok
}

func GetFactoryNames(ctx context.Context) ([]string, bool) {
	value := ctx.Value(CtxKeyFactoryNames)
	if value == nil {
		return nil, false
	}
	factoryNames, ok := value.([]string)
	return factoryNames, ok
}

func GetUserOrganization(ctx context.Context) (map[string]interface{}, bool) {
	value := ctx.Value(CtxKeyUserOrganization)
	if value == nil {
		return nil, false
	}
	org, ok := value.(map[string]interface{})
	return org, ok
}

func GetUserGroups(ctx context.Context) ([]string, bool) {
	value := ctx.Value(CtxKeyUserGroups)
	if value == nil {
		return nil, false
	}
	groups, ok := value.([]string)
	return groups, ok
}

