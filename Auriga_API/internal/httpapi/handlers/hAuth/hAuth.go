package hAuth

import (
	"github.com/labstack/echo/v4"
	"github.com/remrafvil/Auriga_API/config"
	"github.com/remrafvil/Auriga_API/internal/httpapi/handlers"
	"github.com/remrafvil/Auriga_API/internal/httpapi/middlewares"
	"github.com/remrafvil/Auriga_API/internal/services/sAuth"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type handler struct {
	service        sAuth.Service
	authMiddleware *middlewares.AuthMiddleware
	logger         *zap.Logger
}

type Result struct {
	fx.Out

	Handler handlers.Handler `group:"handlers"`
}

type Params struct {
	fx.In

	Service        sAuth.Service
	AuthMiddleware *middlewares.AuthMiddleware
	Logger         *zap.Logger
}

func New(p Params) Result {
	return Result{
		Handler: &handler{
			service:        p.Service,
			authMiddleware: p.AuthMiddleware,
			logger:         p.Logger,
		},
	}
}

func (h *handler) RegisterRoutes(e *echo.Echo, s *config.Settings) {
	// Servir archivos estáticos
	e.Static("/static", "./static")

	// Rutas públicas
	e.GET("/", h.homeHandler)
	e.GET("/health", h.healthHandler)
	e.GET("/login", h.loginPageHandler)
	e.GET("/auth/login", h.loginHandler)
	e.POST("/auth/logout", h.logoutHandler)
	e.GET("/auth/callback", h.authCallbackHandler)

	// ✅ NUEVA: Endpoint para verificar autenticación desde React (público, verifica cookies)
	e.GET("/api/auth/check", h.authCheckHandler)
	// NOTA: /api/auth/user y /api/auth/permissions están en el grupo /api protegido más abajo

	// ✅ Dashboard protegido - CREAR GRUPO SEPARADO PARA RUTAS PROTEGIDAS NO-API
	protected := e.Group("")
	protected.Use(h.authMiddleware.CombinedMiddleware())

	// Rutas protegidas (no-API)
	protected.GET("/dashboard", h.dashboardHandler)

	// Rutas protegidas de API
	api := e.Group("/api")
	api.Use(h.authMiddleware.CombinedMiddleware())

	//api.GET("/profile", h.profileHandler)
	api.GET("/users/me", h.getCurrentUserHandler)
	api.GET("/protected-data", h.protectedDataHandler)
	api.GET("/token-info", h.tokenInfoHandler)
	//api.GET("/token-debug", h.debugTokenHandler)
	api.GET("/my-groups", h.myGroupsHandler)
	
	// ✅ Endpoints de autenticación (requieren autenticación)
	api.GET("/auth/user", h.getCurrentUserHandler)
	
	// ✅ Endpoints de permisos (requieren autenticación)
	api.GET("/auth/permissions", h.permissionsHandler)
	api.GET("/auth/check-permission", h.checkPermissionHandler)

	// ✅ Rutas solo para Administradores
	admin := api.Group("/admin")
	// admin.Use(auth.RequireGroup("authentik Admins"))

	admin.GET("/stats", h.adminStatsHandler)
	// admin.GET("/users", s.adminUsersHandler)
}
