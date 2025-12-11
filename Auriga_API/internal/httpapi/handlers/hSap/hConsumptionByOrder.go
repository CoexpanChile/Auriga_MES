package hSap

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

type mhOrderConsumption struct {
	Factory          string `json:"factory" 			form:"factory" 				query:"factory"`
	ProdLine         string `json:"prodline" 			form:"prodline" 			query:"prodline"`
	System           string `json:"system" 				form:"system" 				query:"system"`
	Machine          string `json:"Machine" 			form:"Machine" 				query:"Machine"`
	Part             string `json:"part" 				form:"part" 				query:"part"`
	SapOrderCode     string `json:"sapordercode" 		form:"sapordercode"			query:"sapordercode"`
	SapRequest       string `json:"saprequest" 			form:"saprequest" 			query:"saprequest"`
	SapComponentCode string `json:"sapcomponentcode" 	form:"sapcomponentcode" 	query:"sapcomponentcode"`
	SapCode          string `json:"sapcode" 			form:"sapcode" 			query:"sapcode"`
}

func (h *handler) OrderConsumption(c echo.Context) error {
	u := new(mhOrderConsumption)
	u.Factory = c.Request().Header.Get("Factory")
	u.ProdLine = c.Request().Header.Get("ProdLine")
	u.System = c.Request().Header.Get("System")
	u.SapOrderCode = c.Request().Header.Get("SapOrderCode")
	u.SapRequest = c.Request().Header.Get("SapRequest")

	log.Println("Factory", u.Factory)
	log.Println("ProdLine", u.ProdLine)
	log.Println("System", u.System)
	log.Println("SapOrderCode", u.SapOrderCode)
	log.Println("SapRequest", u.SapRequest)

	use, err := h.service.DosingConsumptionList(u.Factory, u.ProdLine, u.System, u.SapOrderCode, u.SapRequest)
	if err != nil {
		fmt.Println("registo no: %w", err)
		return c.JSON(http.StatusForbidden, responseMessage{Message: "Registro no existeeee"})
	}

	//log.Println("Estos son los datos:", use)
	return c.JSON(http.StatusOK, use)
}

func (h *handler) OrderConsumptionAdd(c echo.Context) error {
	u := new(mhOrderConsumption)
	u.Factory = c.Request().Header.Get("Factory")
	u.ProdLine = c.Request().Header.Get("ProdLine")
	u.System = c.Request().Header.Get("System")
	u.Machine = c.Request().Header.Get("Machine")
	u.Part = c.Request().Header.Get("Part")
	u.SapOrderCode = c.Request().Header.Get("SapOrderCode")
	u.SapComponentCode = c.Request().Header.Get("SapComponentCode")

	log.Println("Factory", u.Factory)
	log.Println("ProdLine", u.ProdLine)
	log.Println("System", u.System)
	log.Println("Machine", u.Machine)
	log.Println("Part", u.Part)
	log.Println("SapOrderCode", u.SapOrderCode)
	log.Println("SapComponentCode", u.SapComponentCode)

	use, err := h.service.DosingConsumptionAdd(u.Factory, u.ProdLine, u.System, u.Machine, u.Part, u.SapOrderCode, u.SapComponentCode)
	if err != nil {
		fmt.Println("registo no: %w", err)
		return c.JSON(http.StatusInternalServerError, responseMessage{Message: "Registro no insertado"})
	}

	//log.Println("Estos son los datos:", use)
	return c.JSON(http.StatusOK, use)
}

func (h *handler) OrderConsumptionDel(c echo.Context) error {
	u := new(mhOrderConsumption)
	u.Factory = c.Request().Header.Get("Factory")
	u.ProdLine = c.Request().Header.Get("ProdLine")
	u.System = c.Request().Header.Get("System")
	u.Machine = c.Request().Header.Get("Machine")
	u.Part = c.Request().Header.Get("Part")
	u.SapOrderCode = c.Request().Header.Get("SapOrderCode")
	u.SapComponentCode = c.Request().Header.Get("SapComponentCode")

	log.Println("Factory", u.Factory)
	log.Println("ProdLine", u.ProdLine)
	log.Println("System", u.System)
	log.Println("Machine", u.Machine)
	log.Println("Part", u.Part)
	log.Println("SapOrderCode", u.SapOrderCode)
	log.Println("SapComponentCode", u.SapComponentCode)

	use, err := h.service.DosingConsumptionDel(u.Factory, u.ProdLine, u.System, u.Machine, u.Part, u.SapOrderCode, u.SapComponentCode)
	if err != nil {
		fmt.Println("registo no: %w", err)
		return c.JSON(http.StatusInternalServerError, responseMessage{Message: "Registro no borrado"})
	}

	//log.Println("Estos son los datos:", use)
	return c.JSON(http.StatusOK, use)
}

func (h *handler) OrderConsumptionUpdate(c echo.Context) error {
	u := new(mhOrderConsumption)
	u.Factory = c.Request().Header.Get("Factory")
	u.ProdLine = c.Request().Header.Get("ProdLine")
	u.System = c.Request().Header.Get("System")
	u.Machine = c.Request().Header.Get("Machine")
	u.Part = c.Request().Header.Get("Part")
	u.SapOrderCode = c.Request().Header.Get("SapOrderCode")
	u.SapComponentCode = c.Request().Header.Get("SapComponentCode")

	log.Println("Factory", u.Factory)
	log.Println("ProdLine", u.ProdLine)
	log.Println("System", u.System)
	log.Println("Machine", u.Machine)
	log.Println("Part", u.Part)
	log.Println("SapOrderCode", u.SapOrderCode)
	log.Println("SapComponentCode", u.SapComponentCode)

	use, err := h.service.DosingConsumptionUpdate(u.Factory, u.ProdLine, u.System, u.Machine, u.Part, u.SapOrderCode, u.SapComponentCode)
	if err != nil {
		fmt.Println("registo no: %w", err)
		return c.JSON(http.StatusInternalServerError, responseMessage{Message: "Registro no actualizado"})
	}

	//log.Println("Estos son los datos:", use)
	return c.JSON(http.StatusOK, use)
}

func (h *handler) OrderConsumptionCalculate(c echo.Context) error {
	u := new(mhOrderConsumption)
	u.Factory = c.Request().Header.Get("Factory")
	u.ProdLine = c.Request().Header.Get("ProdLine")
	u.SapCode = c.Request().Header.Get("SapCode")
	u.SapOrderCode = c.Request().Header.Get("SapOrderCode")
	startDateStr := c.Request().Header.Get("StartDate")
	endDateStr := c.Request().Header.Get("EndDate")

	log.Println("Factory", u.Factory)
	log.Println("ProdLine", u.ProdLine)
	log.Println("SapCode", u.SapCode)
	log.Println("SapOrderCode", u.SapOrderCode)
	log.Println("StartDate", startDateStr)
	log.Println("EndDate", endDateStr)

	var startDate, endDate *time.Time
	if startDateStr != "" {
		// Intentar parsear con diferentes formatos (el formato ISO puede incluir milisegundos)
		var parsed time.Time
		var err error

		// Formato con milisegundos: 2006-01-02T15:04:05.000Z
		parsed, err = time.Parse("2006-01-02T15:04:05.000Z", startDateStr)
		if err != nil {
			// Si falla, intentar con RFC3339Nano (acepta nanosegundos)
			parsed, err = time.Parse(time.RFC3339Nano, startDateStr)
		}
		if err != nil {
			// Si aún falla, intentar con RFC3339 (sin milisegundos)
			parsed, err = time.Parse(time.RFC3339, startDateStr)
		}

		if err == nil {
			startDate = &parsed
			log.Println("StartDate parsed:", startDate)
		} else {
			log.Printf("Error parsing StartDate '%s': %v", startDateStr, err)
		}
	}
	if endDateStr != "" {
		// Intentar parsear con diferentes formatos (el formato ISO puede incluir milisegundos)
		var parsed time.Time
		var err error

		// Formato con milisegundos: 2006-01-02T15:04:05.000Z
		parsed, err = time.Parse("2006-01-02T15:04:05.000Z", endDateStr)
		if err != nil {
			// Si falla, intentar con RFC3339Nano (acepta nanosegundos)
			parsed, err = time.Parse(time.RFC3339Nano, endDateStr)
		}
		if err != nil {
			// Si aún falla, intentar con RFC3339 (sin milisegundos)
			parsed, err = time.Parse(time.RFC3339, endDateStr)
		}

		if err == nil {
			endDate = &parsed
			log.Println("EndDate parsed:", endDate)
		} else {
			log.Printf("Error parsing EndDate '%s': %v", endDateStr, err)
		}
	}

	use, err := h.service.DosingConsumptionCalculate(u.Factory, u.ProdLine, u.SapOrderCode, startDate, endDate)
	if err != nil {
		fmt.Println("registo no: %w", err)
		return c.JSON(http.StatusInternalServerError, responseMessage{Message: "Registro no actualizado"})
	}

	//log.Println("Estos son los datos:", use)
	return c.JSON(http.StatusOK, use)
}

func (h *handler) OrderConsumptionSummaryToSAP(c echo.Context) error {
	log.Println("🚀 ===== INICIANDO OrderConsumptionSummaryToSAP =====")
	log.Println("📥 Request recibido en /sap/orderConsump/CalcToSAP")
	
	u := new(mhOrderConsumption)
	u.Factory = c.Request().Header.Get("Factory")
	u.ProdLine = c.Request().Header.Get("ProdLine")
	u.SapCode = c.Request().Header.Get("SapCode")
	u.SapOrderCode = c.Request().Header.Get("SapOrderCode")
	startDateStr := c.Request().Header.Get("StartDate")
	endDateStr := c.Request().Header.Get("EndDate")
	workdayID := c.Request().Header.Get("WorkdayID")
	turno := c.Request().Header.Get("Turno")

	log.Println("📋 Headers recibidos:")
	log.Println("  Factory:", u.Factory)
	log.Println("  ProdLine:", u.ProdLine)
	log.Println("  SapCode:", u.SapCode)
	log.Println("  SapOrderCode:", u.SapOrderCode)
	log.Println("  StartDate:", startDateStr)
	log.Println("  EndDate:", endDateStr)
	log.Println("  WorkdayID:", workdayID)
	log.Println("  Turno:", turno)

	// Parsear fechas
	var startDate, endDate *time.Time
	if startDateStr != "" {
		parsed, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			parsed, err = time.Parse("2006-01-02T15:04:05.000Z", startDateStr)
		}
		if err == nil {
			startDate = &parsed
		}
	}
	if endDateStr != "" {
		parsed, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			parsed, err = time.Parse("2006-01-02T15:04:05.000Z", endDateStr)
		}
		if err == nil {
			endDate = &parsed
		}
	}

	// Valores por defecto
	if workdayID == "" {
		workdayID = "EE1010171" // Valor por defecto si no se proporciona
	}
	if turno == "" {
		turno = "T1" // Valor por defecto si no se proporciona
	}

	// Llamar al servicio para enviar a SAP
	log.Println("🔄 Llamando a servicio DosingConsumptionSendToSAP...")
	results, err := h.service.DosingConsumptionSendToSAP(u.Factory, u.ProdLine, u.SapOrderCode, startDate, endDate, workdayID, turno)
	if err != nil {
		log.Printf("❌ Error en servicio DosingConsumptionSendToSAP: %v", err)
		// Incluso si hay errores, devolver los resultados para que el frontend pueda mostrar detalles
		if results != nil && len(results) > 0 {
			log.Printf("📤 Devolviendo resultados parciales: %d resultados", len(results))
			return c.JSON(http.StatusPartialContent, map[string]interface{}{
				"message": err.Error(),
				"results": results,
			})
		}
		log.Printf("❌ No hay resultados para devolver, error completo: %v", err)
		return c.JSON(http.StatusInternalServerError, responseMessage{Message: fmt.Sprintf("Error al enviar consumos a SAP: %v", err)})
	}
	
	log.Printf("✅ Servicio completado exitosamente, devolviendo %d resultados", len(results))

	// Contar éxitos y errores
	successCount := 0
	errorCount := 0
	for _, r := range results {
		if r.Success {
			successCount++
		} else {
			errorCount++
		}
	}

	if errorCount > 0 {
		return c.JSON(http.StatusPartialContent, map[string]interface{}{
			"message":      fmt.Sprintf("Se enviaron %d consumos exitosamente, pero %d fallaron", successCount, errorCount),
			"results":      results,
			"successCount": successCount,
			"errorCount":   errorCount,
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":      "Todos los consumos fueron enviados exitosamente a SAP",
		"results":      results,
		"successCount": successCount,
		"errorCount":   errorCount,
	})
}
