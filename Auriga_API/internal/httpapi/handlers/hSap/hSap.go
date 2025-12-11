package hSap

import (
	"github.com/labstack/echo/v4"
	"github.com/remrafvil/Auriga_API/config"
	"github.com/remrafvil/Auriga_API/internal/httpapi/handlers"
	"github.com/remrafvil/Auriga_API/internal/httpapi/middlewares"
	"github.com/remrafvil/Auriga_API/internal/services/sSap"
	"go.uber.org/fx"
)

type handler struct {
	service        sSap.Service
	authMiddleware *middlewares.AuthMiddleware
}

type Result struct {
	fx.Out

	Handler handlers.Handler `group:"handlers"`
}

type Params struct {
	fx.In

	Service        sSap.Service
	AuthMiddleware *middlewares.AuthMiddleware
}

func New(p Params) Result {
	return Result{
		Handler: &handler{
			service:        p.Service,
			authMiddleware: p.AuthMiddleware,
		},
	}
}

// ejemplo para usar en main.go	routes.Land(e)
func (h *handler) RegisterRoutes(e *echo.Echo, s *config.Settings) {
	//jwtconfig := middlewares.JwtInitConfig()
	//middlewares.MainMiddlewares(e, s)

	r := e.Group("/sap")
	/*middlewares*/
	//r.Use(middleware.JWTWithConfig(jwtconfig))
	// Las rutas /sap NO requieren autenticación por ahora (comentado para desarrollo)
	// r.Use(h.authMiddleware.CombinedMiddleware())

	r.POST("/orders", h.LineOrders)
	r.GET("/orders/startFinish", h.LineOrderStartFinish)
	r.GET("/orders/update", h.LineOrderUpdate)
	r.GET("/orderRecipe", h.OrderRecipe)

	// Rutas de consumption de materiales
	r.GET("/orderConsump/list", h.OrderConsumption)
	r.GET("/orderConsump/add", h.OrderConsumptionAdd)
	r.GET("/orderConsump/del", h.OrderConsumptionDel)
	r.GET("/orderConsump/update", h.OrderConsumptionUpdate)
	r.GET("/orderConsump/Calculate", h.OrderConsumptionCalculate)
	r.GET("/orderConsump/CalcToSAP", h.OrderConsumptionSummaryToSAP)
}
