package sAuth

import (
	"context"

	"github.com/remrafvil/Auriga_API/internal/utils"
	"go.uber.org/zap"
)

// GetUserInfoFromContext obtiene la información del usuario desde el contexto
func (s *service) GetUserInfoFromContext(ctx context.Context) (userID, email, name string, groups []string, organization map[string]interface{}) {
	userID, _ = utils.GetUserID(ctx)
	email, _ = utils.GetUserEmail(ctx)
	name, _ = utils.GetUserName(ctx)
	organization, _ = utils.GetUserOrganization(ctx)
	groups, _ = utils.GetUserGroups(ctx)

	s.logger.Debug("User info extracted from context",
		zap.String("user_id", userID),
		zap.String("email", email),
		zap.String("name", name),
		zap.Int("groups_count", len(groups)),
		zap.Bool("has_organization", organization != nil))

	return
}

// GetUserFactoryNames obtiene los nombres de las fábricas del usuario
func (s *service) GetUserFactoryNames(organization map[string]interface{}) []string {
	var factoryNames []string

	if organization == nil {
		return factoryNames
	}

	factories, ok := organization["factories"].(map[string]interface{})
	if !ok {
		return factoryNames
	}

	for factoryName := range factories {
		factoryNames = append(factoryNames, factoryName)
	}

	s.logger.Debug("User factories extracted",
		zap.Strings("factories", factoryNames),
		zap.Int("count", len(factoryNames)))

	return factoryNames
}
