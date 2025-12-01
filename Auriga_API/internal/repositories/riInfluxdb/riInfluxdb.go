package riInfluxdb

import (
	"fmt"
	"strings"
	"time"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/remrafvil/Auriga_API/databases"
	"go.uber.org/zap"
)

type Repository interface {
	OrderConsumptionCalculate(factory string, prodline string, components []MriDosingComponent, startedAt time.Time, finishedAt time.Time) ([]MriDosingComponent, error)
	GetLineStatus(factory string, lineCode string) (string, float64, error)
	GetLinesStatus(factory string, lineCodes []string) (map[string]LineStatusResponse, error)
	GetLineThroughput(factory string, lineCode string, startTime time.Time, stopTime time.Time, windowPeriod string) ([]ThroughputData, error)
}

// LineStatusResponse representa el estado de una línea
type LineStatusResponse struct {
	LineCode   string    `json:"line_code"`
	Status     string    `json:"status"` // "operativa", "apagada", "unknown"
	LastSeen   time.Time `json:"last_seen"`
	Throughput float64   `json:"throughput"` // Throughput más reciente en kg/h
}

// ThroughputData representa los datos de throughput de una línea
type ThroughputData struct {
	Time     time.Time `json:"time"`
	Value    float64   `json:"value"`
	LineCode string    `json:"line_code"`
}

type repository struct {
	influxManager *databases.InfluxClientManager
	logger        *zap.Logger
}

func New(influxManager *databases.InfluxClientManager, logger *zap.Logger) Repository {
	return &repository{
		influxManager: influxManager,
		logger:        logger,
	}
}

type MriDosingComponent struct {
	DosingUnit   string
	DosingHopper string
	Quantity     float32
}

// getConnectionName mapea el factory al nombre de conexión
func (m *repository) getConnectionName(factory string) (string, error) {
	connectionName := strings.ToLower(factory)

	m.logger.Info("🔍 Buscando conexión específica para fábrica",
		zap.String("factory", factory),
		zap.String("connection_requested", connectionName),
	)

	// 1. Obtener todas las configuraciones
	configs := m.influxManager.GetAllConfigs()

	// Búsqueda case-insensitive
	configExists := false
	var actualKey string

	for k := range configs {
		if strings.EqualFold(k, connectionName) {
			configExists = true
			actualKey = k
			break
		}
	}

	if !configExists {
		configKeys := []string{}
		for k := range configs {
			configKeys = append(configKeys, k)
		}
		m.logger.Error("❌ No existe configuración para la fábrica solicitada",
			zap.String("factory", factory),
			zap.String("connection_requested", connectionName),
			zap.Strings("configuraciones_disponibles", configKeys),
		)
		return "", fmt.Errorf("no existe configuración InfluxDB para la fábrica: %s", factory)
	}

	connectionToUse := actualKey
	m.logger.Info("✅ Configuración encontrada",
		zap.String("factory", factory),
		zap.String("connection_requested", connectionName),
		zap.String("connection_actual", connectionToUse),
	)

	return connectionToUse, nil
}

// getClient obtiene el cliente InfluxDB para el factory especificado
func (m *repository) getClient(factory string) (influxdb2.Client, string, error) {
	connectionName, err := m.getConnectionName(factory)
	if err != nil {
		return nil, "", err
	}

	// Verificar salud primero
	if !m.influxManager.IsHealthy(connectionName) {
		m.logger.Error("❌ Cliente InfluxDB no disponible (verificación tiempo real)",
			zap.String("factory", factory),
			zap.String("connection", connectionName),
		)
		return nil, "", fmt.Errorf("cliente InfluxDB no disponible para: %s", connectionName)
	}

	// Obtener el cliente
	client, exists := m.influxManager.GetClient(connectionName)
	if !exists {
		m.logger.Error("❌ Cliente InfluxDB no encontrado",
			zap.String("factory", factory),
			zap.String("connection", connectionName),
		)
		return nil, "", fmt.Errorf("cliente InfluxDB no encontrado para: %s", connectionName)
	}

	return client, connectionName, nil
}
