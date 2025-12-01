package riInfluxdb

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
)

// GetLineStatus obtiene el estado de una línea de producción desde InfluxDB
// Consulta el último valor de un campo que indique si la línea está operativa
// También obtiene el throughput más reciente
func (m *repository) GetLineStatus(factory string, lineCode string) (string, float64, error) {
	logger := m.logger.With(
		zap.String("factory", factory),
		zap.String("lineCode", lineCode),
	)

	// Obtener el cliente InfluxDB para este factory
	client, connectionName, err := m.getClient(factory)
	if err != nil {
		logger.Error("Failed to get InfluxDB client for factory",
			zap.String("factory", factory),
			zap.Error(err))
		return "unknown", 0.0, fmt.Errorf("failed to get InfluxDB client for factory %s: %w", factory, err)
	}

	// Obtener la configuración
	cfg, exists := m.influxManager.GetConfig(connectionName)
	if !exists {
		return "unknown", 0.0, fmt.Errorf("configuración no encontrada para conexión: %s", connectionName)
	}

	// Verificar salud de la conexión
	if !m.influxManager.IsHealthy(connectionName) {
		return "unknown", 0.0, fmt.Errorf("conexión InfluxDB no disponible para fábrica: %s", factory)
	}

	// Construir consulta para obtener el último dato de la línea y el throughput
	// Buscamos cualquier campo que indique actividad reciente (últimos 5 minutos)
	// También obtenemos el throughput más reciente
	query := fmt.Sprintf(
		`from(bucket: "%s")
		|> range(start: -5m)
		|> filter(fn: (r) => r["name"] == "%s" or r["_measurement"] == "%s")
		|> last()`,
		cfg.Bucket, lineCode, lineCode)
	
	// Query separada para obtener el throughput más reciente
	throughputQuery := fmt.Sprintf(
		`from(bucket: "%s")
		|> range(start: -5m)
		|> filter(fn: (r) => r["name"] == "%s")
		|> filter(fn: (r) => r["EL_Lv1"] == "0_Common")
		|> filter(fn: (r) => r["EL_Lv2"] == "Throughput")
		|> filter(fn: (r) => r["_field"] == "Throughput_Act_kgh")
		|> last()`,
		cfg.Bucket, lineCode)

	logger.Debug("Executing InfluxDB query for line status",
		zap.String("query", query))

	// Ejecutar la consulta con timeout
	queryAPI := client.QueryAPI(cfg.Org)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := queryAPI.Query(ctx, query)
	if err != nil {
		logger.Error("Failed to execute InfluxDB query for line status",
			zap.String("factory", factory),
			zap.String("lineCode", lineCode),
			zap.Error(err))
		return "unknown", 0.0, fmt.Errorf("failed to query InfluxDB for line %s: %w", lineCode, err)
	}

	// Si hay resultados, la línea está operativa
	hasData := false
	for result.Next() {
		hasData = true
		break
	}

	if result.Err() != nil {
		logger.Warn("Error processing query results",
			zap.Error(result.Err()))
		return "unknown", 0.0, nil // No es un error crítico, retornamos unknown
	}

	// Obtener throughput más reciente
	var throughput float64 = 0.0
	throughputResult, err := queryAPI.Query(ctx, throughputQuery)
	if err == nil {
		for throughputResult.Next() {
			record := throughputResult.Record()
			if val, ok := record.Value().(float64); ok {
				throughput = val
				break
			} else if val, ok := record.Value().(int64); ok {
				throughput = float64(val)
				break
			}
		}
		if throughputResult.Err() != nil {
			logger.Debug("Error getting throughput, continuing without it",
				zap.Error(throughputResult.Err()))
		}
	} else {
		logger.Debug("Failed to query throughput, continuing without it",
			zap.Error(err))
	}

	if hasData {
		logger.Info("Line status retrieved",
			zap.String("lineCode", lineCode),
			zap.String("status", "operativa"),
			zap.Float64("throughput", throughput))
		return "operativa", throughput, nil
	}

	logger.Info("No recent data found for line",
		zap.String("lineCode", lineCode),
		zap.String("status", "apagada"))
	return "apagada", throughput, nil
}

// GetLinesStatus obtiene el estado de múltiples líneas
func (m *repository) GetLinesStatus(factory string, lineCodes []string) (map[string]LineStatusResponse, error) {
	statusMap := make(map[string]LineStatusResponse)
	
	for _, lineCode := range lineCodes {
		status, throughput, err := m.GetLineStatus(factory, lineCode)
		if err != nil {
			// Si hay error, marcamos como unknown pero continuamos con las demás
			statusMap[lineCode] = LineStatusResponse{
				LineCode:   lineCode,
				Status:     "unknown",
				LastSeen:   time.Time{},
				Throughput: 0.0,
			}
			continue
		}
		
		statusMap[lineCode] = LineStatusResponse{
			LineCode:   lineCode,
			Status:     status,
			LastSeen:   time.Now(),
			Throughput: throughput,
		}
	}
	
	return statusMap, nil
}

