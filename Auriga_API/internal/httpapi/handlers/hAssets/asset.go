package hAssets

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type responseMessage struct {
	Message string `json:"message"`
}

type Handler interface {
	AssetShow(c echo.Context) error
	AssetList(c echo.Context) error
	GetLinesStatus(c echo.Context) error
	GetLineThroughput(c echo.Context) error
	GetLineInfo(c echo.Context) error
}

type mhAsset struct {
	ID       uint   `json:"id" form:"id" query:"id"`
	ParentID uint   `json:"parent_id" form:"parent_id" query:"parent_id"`
	Code     string `json:"code" form:"code" query:"code"`
}

func (h *handler) AssetShow(c echo.Context) error {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	log.Println(id)
	use, err := h.service.AssetInfo(uint(id))

	log.Println("Error aqui:", err)
	if err != nil {
		fmt.Println("registo no: %w", err)
		return c.JSON(http.StatusForbidden, responseMessage{Message: "Activo no existeeee"})
	}
	return c.JSON(http.StatusOK, use)
}

func (h *handler) AssetShowDetail(c echo.Context) error {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	log.Println(id)
	use, err := h.service.GetAssetWithSimplifiedProduct(uint(id))

	log.Println("Error aqui:", err)
	if err != nil {
		fmt.Println("registo no: %w", err)
		return c.JSON(http.StatusForbidden, responseMessage{Message: "Activo no existeeee"})
	}
	return c.JSON(http.StatusOK, use)
}

func (h *handler) AssetShowHierarchi(c echo.Context) error {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	log.Println(id)
	use, err := h.service.GetAssetHierarchy(uint(id))

	log.Println("Error aqui:", err)
	if err != nil {
		fmt.Println("registo no: %w", err)
		return c.JSON(http.StatusForbidden, responseMessage{Message: "Activo no existeeee"})
	}
	return c.JSON(http.StatusOK, use)
}

func (h *handler) AssetList(c echo.Context) error {
	// ✅ Obtener el contexto estándar ya preparado por el middleware
	ctx := c.Request().Context()

	// ✅ Llamar directamente al servicio - el contexto ya tiene toda la información
	list, err := h.service.AssetList(ctx)
	if err != nil {
		h.logger.Error("Service call failed",
			zap.Error(err),
			zap.String("handler", "AssetList"))
		return err
	}

	h.logger.Info("Asset list completed successfully",
		zap.Int("count", len(list)),
		zap.String("handler", "AssetList"))

	return c.JSON(http.StatusOK, list)
}

func (h *handler) GetLinesStatus(c echo.Context) error {
	ctx := c.Request().Context()
	
	// Obtener parámetros de la query
	factory := c.QueryParam("factory")
	lineCodesParam := c.QueryParam("lines")
	
	if factory == "" {
		return c.JSON(http.StatusBadRequest, responseMessage{Message: "factory parameter is required"})
	}
	
	if lineCodesParam == "" {
		return c.JSON(http.StatusBadRequest, responseMessage{Message: "lines parameter is required"})
	}
	
	// Parsear códigos de líneas (separados por coma)
	lineCodes := []string{}
	for _, code := range strings.Split(lineCodesParam, ",") {
		code = strings.TrimSpace(code)
		if code != "" {
			lineCodes = append(lineCodes, code)
		}
	}
	
	if len(lineCodes) == 0 {
		return c.JSON(http.StatusBadRequest, responseMessage{Message: "at least one line code is required"})
	}
	
	// Obtener estados desde InfluxDB
	statusMap, err := h.service.GetLinesStatus(ctx, factory, lineCodes)
	if err != nil {
		h.logger.Error("Failed to get lines status",
			zap.String("factory", factory),
			zap.Error(err))
		return c.JSON(http.StatusInternalServerError, responseMessage{Message: "Error al obtener estado de líneas"})
	}
	
	return c.JSON(http.StatusOK, statusMap)
}

func (h *handler) GetLineThroughput(c echo.Context) error {
	ctx := c.Request().Context()
	
	// Obtener parámetros de la query
	factory := c.QueryParam("factory")
	lineCode := c.QueryParam("line")
	startTimeParam := c.QueryParam("start")
	stopTimeParam := c.QueryParam("stop")
	windowPeriod := c.QueryParam("window") // Ej: "1m", "5m", "1h"
	
	if factory == "" {
		return c.JSON(http.StatusBadRequest, responseMessage{Message: "factory parameter is required"})
	}
	
	if lineCode == "" {
		return c.JSON(http.StatusBadRequest, responseMessage{Message: "line parameter is required"})
	}
	
	// Parsear tiempos (formato RFC3339 o timestamp Unix)
	var startTime, stopTime time.Time
	var err error
	
	if startTimeParam == "" {
		// Por defecto: últimas 24 horas
		stopTime = time.Now()
		startTime = stopTime.Add(-24 * time.Hour)
	} else {
		startTime, err = time.Parse(time.RFC3339, startTimeParam)
		if err != nil {
			// Intentar como timestamp Unix
			if timestamp, parseErr := strconv.ParseInt(startTimeParam, 10, 64); parseErr == nil {
				startTime = time.Unix(timestamp, 0)
			} else {
				return c.JSON(http.StatusBadRequest, responseMessage{Message: "invalid start time format. Use RFC3339 or Unix timestamp"})
			}
		}
	}
	
	if stopTimeParam == "" {
		stopTime = time.Now()
	} else {
		stopTime, err = time.Parse(time.RFC3339, stopTimeParam)
		if err != nil {
			// Intentar como timestamp Unix
			if timestamp, parseErr := strconv.ParseInt(stopTimeParam, 10, 64); parseErr == nil {
				stopTime = time.Unix(timestamp, 0)
			} else {
				return c.JSON(http.StatusBadRequest, responseMessage{Message: "invalid stop time format. Use RFC3339 or Unix timestamp"})
			}
		}
	}
	
	// Validar que startTime < stopTime
	if startTime.After(stopTime) {
		return c.JSON(http.StatusBadRequest, responseMessage{Message: "start time must be before stop time"})
	}
	
	// Valor por defecto para windowPeriod
	if windowPeriod == "" {
		windowPeriod = "1m"
	}
	
	// Obtener throughput desde InfluxDB
	throughputData, err := h.service.GetLineThroughput(ctx, factory, lineCode, startTime, stopTime, windowPeriod)
	if err != nil {
		h.logger.Error("Failed to get line throughput",
			zap.String("factory", factory),
			zap.String("lineCode", lineCode),
			zap.Error(err))
		return c.JSON(http.StatusInternalServerError, responseMessage{Message: "Error al obtener throughput de la línea"})
	}
	
	return c.JSON(http.StatusOK, throughputData)
}

func (h *handler) GetLineInfo(c echo.Context) error {
	ctx := c.Request().Context()
	
	// Obtener parámetro opcional de fábrica
	factory := c.QueryParam("factory")
	
	// Obtener información de líneas desde el servicio
	lineInfo, err := h.service.GetLineInfo(ctx, factory)
	if err != nil {
		h.logger.Error("Failed to get line info",
			zap.String("factory", factory),
			zap.Error(err))
		return c.JSON(http.StatusInternalServerError, responseMessage{Message: "Error al obtener información de líneas"})
	}
	
	return c.JSON(http.StatusOK, lineInfo)
}
