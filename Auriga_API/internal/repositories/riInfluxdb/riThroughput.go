package riInfluxdb

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
)

// GetLineThroughput obtiene el throughput de una línea de producción desde InfluxDB
func (m *repository) GetLineThroughput(factory string, lineCode string, startTime time.Time, stopTime time.Time, windowPeriod string) ([]ThroughputData, error) {
	logger := m.logger.With(
		zap.String("factory", factory),
		zap.String("lineCode", lineCode),
		zap.Time("startTime", startTime),
		zap.Time("stopTime", stopTime),
		zap.String("windowPeriod", windowPeriod),
	)

	// Obtener el cliente InfluxDB para este factory
	client, connectionName, err := m.getClient(factory)
	if err != nil {
		logger.Error("Failed to get InfluxDB client for factory",
			zap.String("factory", factory),
			zap.Error(err))
		return nil, fmt.Errorf("failed to get InfluxDB client for factory %s: %w", factory, err)
	}

	// Obtener la configuración
	cfg, exists := m.influxManager.GetConfig(connectionName)
	if !exists {
		return nil, fmt.Errorf("configuración no encontrada para conexión: %s", connectionName)
	}

	// Verificar salud de la conexión
	if !m.influxManager.IsHealthy(connectionName) {
		return nil, fmt.Errorf("conexión InfluxDB no disponible para fábrica: %s", factory)
	}

	// Validar windowPeriod (debe ser un formato válido como "1m", "5m", "1h", etc.)
	if windowPeriod == "" {
		windowPeriod = "1m" // Valor por defecto
	}

	// Construir la query de throughput
	query := fmt.Sprintf(
		`from(bucket: "%s")
		|> range(start: %s, stop: %s)
		|> filter(fn: (r) => r["name"] == "%s")
		|> filter(fn: (r) => r["EL_Lv1"] == "0_Common")
		|> filter(fn: (r) => r["EL_Lv2"] == "Throughput")
		|> filter(fn: (r) => r["_field"] == "Throughput_Act_kgh")
		|> aggregateWindow(every: %s, fn: mean, createEmpty: false)
		|> yield(name: "mean")`,
		cfg.Bucket,
		startTime.Format(time.RFC3339),
		stopTime.Format(time.RFC3339),
		lineCode,
		windowPeriod)

	logger.Debug("Executing InfluxDB query for line throughput",
		zap.String("query", query))

	// Ejecutar la consulta con timeout
	queryAPI := client.QueryAPI(cfg.Org)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	result, err := queryAPI.Query(ctx, query)
	if err != nil {
		logger.Error("Failed to execute InfluxDB query for line throughput",
			zap.String("factory", factory),
			zap.String("lineCode", lineCode),
			zap.Error(err))
		return nil, fmt.Errorf("failed to query InfluxDB for line throughput %s: %w", lineCode, err)
	}

	// Procesar resultados
	var throughputData []ThroughputData
	for result.Next() {
		record := result.Record()
		
		// Extraer el valor
		var value float64
		if val, ok := record.Value().(float64); ok {
			value = val
		} else if val, ok := record.Value().(int64); ok {
			value = float64(val)
		} else {
			logger.Warn("Unexpected value type in throughput data",
				zap.Any("value", record.Value()),
				zap.String("type", fmt.Sprintf("%T", record.Value())))
			continue
		}

		throughputData = append(throughputData, ThroughputData{
			Time:     record.Time(),
			Value:    value,
			LineCode: lineCode,
		})
	}

	if result.Err() != nil {
		logger.Warn("Error processing query results",
			zap.Error(result.Err()))
		return throughputData, nil // Retornar los datos obtenidos hasta el error
	}

	logger.Info("Throughput data retrieved",
		zap.String("lineCode", lineCode),
		zap.Int("dataPoints", len(throughputData)))

	return throughputData, nil
}

