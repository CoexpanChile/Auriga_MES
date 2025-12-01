package sAuth

import (
	"context"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/remrafvil/Auriga_API/config"
	"github.com/remrafvil/Auriga_API/internal/repositories/rAuth"
	"github.com/remrafvil/Auriga_API/internal/repositories/rModels"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

type Service interface {
	ValidateTokenWithClaims(tokenString string) (jwt.MapClaims, error)
	GetAuthURL(state string) string
	GetAuthURLWithPrompt(state string, prompt string) string
	GetAuthURLWithMultiplePrompts(state string, prompts []string) string
	GetAuthURLForNewLogin(state string) string
	GetLogoutURL(idTokenHint string) string
	GetLogoutURLWithRedirect(state string) string
	GetLogoutURLWithFrontendRedirect(idTokenHint string, frontendRedirectURL string) string
	GetLogoutURLToAuthentikOverview(idTokenHint string) string
	ExchangeCode(ctx context.Context, code string) (*oauth2.Token, error)
	GetUserInfo(ctx context.Context, token *oauth2.Token) (*rModels.AuthentikUserInfo, error)
	SyncUser(userInfo *rModels.AuthentikUserInfo) (*rModels.MrEmployee, error)
	FindCurrentUserInfo(userID string, ctx context.Context) (*rModels.MrEmployee, error)
	GetEmployeeWithOrganization(userID string, ctx context.Context) (*rModels.MrEmployee, map[string]interface{}, error)
	ValidateToken(tokenString string) (*jwt.Token, error)
	GetValidator() *JWKSValidator

	ForceRefreshJWKS() error
	AddToBlacklist(token string, expiresAt time.Time)
	IsTokenRevoked(token string) bool
	CleanupBlacklist()

	// MÉTODOS para información del usuario
	GetUserInfoFromContext(ctx context.Context) (userID, email, name string, groups []string, organization map[string]interface{})
	GetUserFactoryNames(organization map[string]interface{}) []string
}

type service struct {
	repository  rAuth.Repository
	config      *config.Settings
	logger      *zap.Logger
	oauthConfig *oauth2.Config
	validator   *JWKSValidator
	blacklist   *TokenBlacklist
}

func New(
	logger *zap.Logger,
	config *config.Settings,
	validator *JWKSValidator,
	repository rAuth.Repository,
) Service {
	oauthConfig := &oauth2.Config{
		ClientID:     config.AuthConfig.ClientID,
		ClientSecret: config.AuthConfig.ClientSecret,
		RedirectURL:  config.AuthConfig.RedirectURL,
		Scopes:       []string{"openid", "email", "profile", "groups", "Auriga"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  config.AuthConfig.Issuer + "/application/o/authorize/",
			TokenURL: config.AuthConfig.Issuer + "/application/o/token/",
		},
	}

	return &service{
		repository:  repository,
		logger:      logger,
		config:      config,
		oauthConfig: oauthConfig,
		validator:   validator,
		blacklist:   NewTokenBlacklist(),
	}
}
