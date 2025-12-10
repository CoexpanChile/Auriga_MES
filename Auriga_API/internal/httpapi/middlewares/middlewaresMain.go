package middlewares

import (
	"fmt"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/remrafvil/Auriga_API/config"
	"go.uber.org/zap"
)

func MainMiddlewares(e *echo.Echo, s *config.Settings, logger *zap.Logger) {
	grafanaConnection1 := fmt.Sprintf(
		"http://%s:%d",
		s.Grafana1.Host,
		s.Grafana1.Port,
	)
	grafanaConnection2 := fmt.Sprintf(
		"http://%s:%d",
		s.Grafana2.Host,
		s.Grafana2.Port,
	)
	//log.Println("*****************  Inserto los MainMiddlewares *****************", grafanaConnection1)
	//log.Println("*****************  Inserto los MainMiddlewares *****************", grafanaConnection2)
	log.Println("*****************  *****************    Inserto los MainMiddlewares *****************  *****************")
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	frontendURL := "http://18.213.58.26:5826"
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{frontendURL, grafanaConnection1, grafanaConnection2},
		AllowHeaders:     []string{"*", "Content-Type", "Factory", "ProdLine", "ProdLine_ID", "prodline_id", "SapCode", "SapOrderCode", "SapRequest", "saprequest", "System", "StartDate", "startdate", "EndDate", "enddate", "SapComponentCode", "sapcomponentcode", "Machine", "machine", "Part", "part"},
		AllowMethods:     []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
		AllowCredentials: true,  // ✅ IMPORTANTE: Permitir cookies
		MaxAge:           86400, // ✅ Cache preflight requests
	}))
	//	e.Use(middleware.Gzip())
	// Middlewares específicos según entorno
	if !s.IsProduction() {
		e.Use(middleware.BodyDump(func(c echo.Context, reqBody, resBody []byte) {
			logger.Debug("HTTP Request",
				zap.String("path", c.Path()),
				zap.String("method", c.Request().Method),
				zap.Int("request_size", len(reqBody)),
				zap.Int("response_size", len(resBody)),
			)
		}))
	}

	logger.Info("Global middlewares configured",
		zap.String("environment", s.App.Zap),
		zap.Bool("production", s.IsProduction()),
	)
}
