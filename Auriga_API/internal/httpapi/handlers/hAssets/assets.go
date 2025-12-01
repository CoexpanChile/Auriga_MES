package hAssets

import (
	"github.com/labstack/echo/v4"
	"github.com/remrafvil/Auriga_API/config"
	"github.com/remrafvil/Auriga_API/internal/httpapi/handlers"
	"github.com/remrafvil/Auriga_API/internal/httpapi/middlewares"
	"github.com/remrafvil/Auriga_API/internal/services/sAssets"
	"github.com/remrafvil/Auriga_API/internal/services/sAuth"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type handler struct {
	service        sAssets.Service
	authService    sAuth.Service
	authMiddleware *middlewares.AuthMiddleware
	logger         *zap.Logger
}

type Result struct {
	fx.Out

	Handler handlers.Handler `group:"handlers"`
}

type Params struct {
	fx.In

	Service        sAssets.Service
	AuthService    sAuth.Service
	AuthMiddleware *middlewares.AuthMiddleware
	Logger         *zap.Logger
}

func New(p Params) Result {
	return Result{
		Handler: &handler{
			service:        p.Service,
			authService:    p.AuthService,
			authMiddleware: p.AuthMiddleware,
			logger:         p.Logger,
		},
	}
}

// ejemplo para usar en main.go	routes.Asset(e)
func (h *handler) RegisterRoutes(e *echo.Echo, s *config.Settings) {
	//middlewares.MainMiddlewares(e, s)
	//jwtconfig := middlewares.JwtInitConfig()

	r := e.Group("/asset")
	/*middlewares*/
	//r.Use(middleware.JWTWithConfig(jwtconfig))
	r.Use(h.authMiddleware.CombinedMiddleware())

	//r.Use(h.authMiddleware.Handler())

	r.GET("/show/:id", h.AssetShow)
	r.GET("/showdetail/:id", h.AssetShowDetail)
	r.GET("/showHierarchi/:id", h.AssetShowHierarchi)
	r.GET("/list", h.AssetList)
	r.GET("/dosingbyline", h.DosingSystemByLine)
	r.GET("/dosercomponents", h.DoserComponents)
	r.GET("/lines/status", h.GetLinesStatus)
	r.GET("/lines/throughput", h.GetLineThroughput)
	r.GET("/lines/info", h.GetLineInfo)
}
