package sSap

import (
	"bytes"
	"encoding/xml"
	"fmt"
	"log"
	"net/http"
	"time"
)

type SAPConsumptionPayload struct {
	XMLName        xml.Name `xml:"ns1:ZPP_IOT_CONSUMOS_ORDEN"`
	Xmlns          string   `xml:"xmlns:ns1,attr"`
	IV_WERKS       string   `xml:"IV_WERKS"`
	IV_AUFNR       string   `xml:"IV_AUFNR"`
	IV_ARBPL       string   `xml:"IV_ARBPL"`
	IV_EXIDV       string   `xml:"IV_EXIDV"`
	IV_ID_SILO     string   `xml:"IV_ID_SILO"`
	IV_OPERARIO    string   `xml:"IV_OPERARIO"`
	IV_TURNO       string   `xml:"IV_TURNO"`
	IV_MATNR       string   `xml:"IV_MATNR"`
	IV_TIMESTAMP_INI string `xml:"IV_TIMESTAMP_INI"`
	IV_TIMESTAMP_FIN string `xml:"IV_TIMESTAMP_FIN"`
}

func (s *service) DosingConsumptionSendToSAP(factory string, prodline string, sapOrderCode string, startDate *time.Time, endDate *time.Time, workdayID string, turno string) error {
	// Obtener consumos calculados
	consumptions, err := s.repositoryOrd.ConsumptionByOrder(sapOrderCode, factory, prodline)
	if err != nil {
		log.Println("Error obteniendo consumos Service DosingConsumptionSendToSAP:", err)
		return err
	}

	if len(consumptions) == 0 {
		return fmt.Errorf("no hay consumos para enviar a SAP")
	}

	// Obtener fechas
	var startedAt, finishedAt time.Time
	if startDate != nil && endDate != nil {
		startedAt = *startDate
		finishedAt = *endDate
	} else {
		startedAt, finishedAt, err = s.repositoryOrd.LineOrdersFindStartFinish(factory, prodline, sapOrderCode)
		if err != nil {
			log.Println("Error obteniendo fechas Service DosingConsumptionSendToSAP:", err)
			return err
		}
	}

	// Validar fechas
	zeroTime := time.Time{}
	if startedAt.Equal(zeroTime) || finishedAt.Equal(zeroTime) {
		return fmt.Errorf("las fechas de inicio y fin de la orden de fabricación no están configuradas")
	}

	// Obtener factory sap_code desde mr_assets
	// Buscar asset de factory (hierarchical_level[1] = factory, hierarchical_level[2] IS NULL)
	factoryAsset, err := s.repositoryAss.AssetByFactLine(factory, "")
	if err != nil || factoryAsset.SapCode == "" {
		log.Printf("Error obteniendo factory asset para %s: %v, usando factory como sap_code", factory, err)
		// Si no se encuentra, usar el factory como sap_code (fallback)
		factoryAsset.SapCode = factory
	}

	// Obtener línea sap_code desde mr_assets
	lineAsset, err := s.repositoryAss.AssetByFactLine(factory, prodline)
	if err != nil || lineAsset.SapCode == "" {
		log.Printf("Error obteniendo línea asset para %s/%s: %v, usando prodline como sap_code", factory, prodline, err)
		// Si no se encuentra, usar prodline como sap_code (fallback)
		lineAsset.SapCode = prodline
	}

	// URL de la API de SAP
	sapURL := "https://l20163-iflmap.hcisbp.eu1.hana.ondemand.com/http/SAP_RFC_IOT_DHM"
	
	// Credenciales Basic Auth
	username := "s020695322"
	password := "1Lanter[]"
	
	// Enviar cada consumo a SAP
	successCount := 0
	errorCount := 0
	
	for _, consumption := range consumptions {
		// Construir el payload XML
		payload := SAPConsumptionPayload{
			Xmlns:          "urn:sap-com:document:sap:rfc:functions",
			IV_WERKS:       factoryAsset.SapCode,
			IV_AUFNR:       sapOrderCode,
			IV_ARBPL:       lineAsset.SapCode,
			IV_EXIDV:       consumption.DosingUnit, // Dosificador code
			IV_ID_SILO:     "SL00",                 // Por defecto SL00
			IV_OPERARIO:    workdayID,
			IV_TURNO:       turno,
			IV_MATNR:       consumption.MrComponentSapCode,
			IV_TIMESTAMP_INI: startedAt.Format("2006-01-02T15:04:05.000Z"),
			IV_TIMESTAMP_FIN: finishedAt.Format("2006-01-02T15:04:05.000Z"),
		}

		// Generar XML
		xmlData, err := xml.MarshalIndent(payload, "", "    ")
		if err != nil {
			log.Printf("Error generando XML para consumo %s: %v", consumption.MrComponentSapCode, err)
			errorCount++
			continue
		}

		// Agregar header XML
		xmlString := `<?xml version="1.0" encoding="UTF-8"?>` + "\n" + string(xmlData)
		
		log.Printf("📤 Enviando a SAP: %s - Componente: %s - Dosificador: %s", sapOrderCode, consumption.MrComponentSapCode, consumption.DosingUnit)
		log.Printf("XML: %s", xmlString)

		// Crear request
		req, err := http.NewRequest("POST", sapURL, bytes.NewBufferString(xmlString))
		if err != nil {
			log.Printf("Error creando request para consumo %s: %v", consumption.MrComponentSapCode, err)
			errorCount++
			continue
		}

		// Headers
		req.Header.Set("Content-Type", "application/xml")
		req.SetBasicAuth(username, password)

		// Enviar request
		client := &http.Client{
			Timeout: 30 * time.Second,
		}
		
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Error enviando a SAP para consumo %s: %v", consumption.MrComponentSapCode, err)
			errorCount++
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			log.Printf("✅ Consumo %s enviado exitosamente a SAP (Status: %d)", consumption.MrComponentSapCode, resp.StatusCode)
			successCount++
		} else {
			log.Printf("❌ Error enviando consumo %s a SAP (Status: %d)", consumption.MrComponentSapCode, resp.StatusCode)
			errorCount++
		}
	}

	if errorCount > 0 {
		return fmt.Errorf("se enviaron %d consumos exitosamente, pero %d fallaron", successCount, errorCount)
	}

	log.Printf("✅ Todos los consumos (%d) fueron enviados exitosamente a SAP", successCount)
	return nil
}
