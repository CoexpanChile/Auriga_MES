package sSap

import (
	"fmt"
	"log"
	"time"

	"github.com/remrafvil/Auriga_API/internal/repositories/riInfluxdb"
)

type msDosingComponent struct {
	DosingUnit        string    `json:"DosingUnit"`
	DosingHopper      string    `json:"DosingHopper"`
	ComponentSapCode  string    `json:"ComponentSapCode"`
	CommittedQuantity float32   `json:"CommittedQuantity"`
	CreatedAt         time.Time `json:"CreatedAt"`
	UpdatedAt         time.Time `json:"UpdatedAt"`
}

func (s *service) DosingConsumptionList(factory string, prodline string, system string, sapOrderCode string, sapRequest string) ([]msDosingComponent, error) {
	var data = []msDosingComponent{}

	// Obtenemos el activo por la linea de la fabrica
	// assetOrder, err := s.repositoryAss.AssetByFactLine(factory, prodline)
	// if err != nil {
	// 	log.Println("Activo no detectado Service DosingConsumptionList:", err)
	// 	return data, err
	// }

	consumptions, err := s.repositoryOrd.ConsumptionByOrder(sapOrderCode, factory, prodline)
	if err != nil {
		log.Println("Error lectura listado Service DosingConsumptionList:", err)
		return data, err
	}

	//	log.Println("consumptions:", consumptions)

	for _, c := range consumptions {
		// Verificar si las fechas son válidas (no zero time)
		hasCreatedAt := !c.CreatedAt.IsZero()
		hasUpdatedAt := !c.UpdatedAt.IsZero()
		log.Printf("📅 Mapeando consumo: Component=%s, CreatedAt=%v (zero=%v), UpdatedAt=%v (zero=%v)", 
			c.MrComponentSapCode, c.CreatedAt, !hasCreatedAt, c.UpdatedAt, !hasUpdatedAt)
		
		data = append(data, msDosingComponent{
			DosingUnit:        c.DosingUnit,
			DosingHopper:      c.Hopper,
			ComponentSapCode:  c.MrComponentSapCode,
			CommittedQuantity: c.CommittedQuantity,
			CreatedAt:         c.CreatedAt,
			UpdatedAt:         c.UpdatedAt,
		})
	}

	if len(data) == 0 {
		data = []msDosingComponent{
			{
				DosingUnit:        " ",
				DosingHopper:      " ",
				ComponentSapCode:  " ",
				CommittedQuantity: 0.0,
			},
		}
	}
	// data = []msDosingComponent{
	// 	{
	// 		DosingUnit:        "Ferlin_01",
	// 		DosingHopper:      "H_01",
	// 		ComponentSapCode:  "COMP001",
	// 		CommittedQuantity: 50.5,
	// 	},
	// 	{
	// 		DosingUnit:        "Ferlin_01",
	// 		DosingHopper:      "H_02",
	// 		ComponentSapCode:  "COMP001",
	// 		CommittedQuantity: 50.5,
	// 	},
	// 	{
	// 		DosingUnit:        "Ferlin_02",
	// 		DosingHopper:      "H_01",
	// 		ComponentSapCode:  "COMP001",
	// 		CommittedQuantity: 50.5,
	// 	},
	// 	{
	// 		DosingUnit:        "Ferlin_02",
	// 		DosingHopper:      "H_02",
	// 		ComponentSapCode:  "COMP001",
	// 		CommittedQuantity: 50.5,
	// 	},
	// }

	return data, nil
}

func (s *service) DosingConsumptionAdd(factory string, prodline string, dosingSystem string, dosingUnit string, dosingComponent string, sapOrderCode string, sapComponentCode string) ([]msDosingComponent, error) {
	var data = []msDosingComponent{}

	// Obtenemos el activo por la linea de la fabrica
	// assetOrder, err := s.repositoryAss.AssetByFactLine(factory, prodline)
	// if err != nil {
	// 	log.Println("Activo no detectado Service DosingConsumptionAdd:", err)
	// 	return data, err
	// }
	log.Println("sapComponentCode:", sapComponentCode)
	consumptions, err := s.repositoryOrd.ConsumptionComponentAdd(sapOrderCode, sapComponentCode, factory, prodline, dosingUnit, dosingComponent)
	if err != nil {
		log.Println("Error añadir Service DosingConsumptionAdd:", err)
		return data, err
	}

	log.Println("consumptions:", consumptions)

	return data, nil
}

func (s *service) DosingConsumptionDel(factory string, prodline string, dosingSystem string, dosingUnit string, dosingComponent string, sapOrderCode string, sapComponentCode string) ([]msDosingComponent, error) {
	var data = []msDosingComponent{}
	// Obtenemos el activo por la linea de la fabrica
	// assetOrder, err := s.repositoryAss.AssetByFactLine(factory, prodline)
	// if err != nil {
	// 	log.Println("Activo no detectado Service DosingConsumptionDel:", err)
	// 	return data, err
	// }

	consumptions, err := s.repositoryOrd.ConsumptionComponentDel(sapOrderCode, sapComponentCode, factory, prodline, dosingUnit, dosingComponent)
	if err != nil {
		log.Println("Error borrado Service ConsumptionComponentDel:", err)
		return data, err
	}
	for _, c := range consumptions {
		// Verificar si las fechas son válidas (no zero time)
		hasCreatedAt := !c.CreatedAt.IsZero()
		hasUpdatedAt := !c.UpdatedAt.IsZero()
		log.Printf("📅 Mapeando consumo: Component=%s, CreatedAt=%v (zero=%v), UpdatedAt=%v (zero=%v)", 
			c.MrComponentSapCode, c.CreatedAt, !hasCreatedAt, c.UpdatedAt, !hasUpdatedAt)
		
		data = append(data, msDosingComponent{
			DosingUnit:        c.DosingUnit,
			DosingHopper:      c.Hopper,
			ComponentSapCode:  c.MrComponentSapCode,
			CommittedQuantity: c.CommittedQuantity,
			CreatedAt:         c.CreatedAt,
			UpdatedAt:         c.UpdatedAt,
		})
	}
	return data, nil
}

func (s *service) DosingConsumptionUpdate(factory string, prodline string, dosingSystem string, dosingUnit string, dosingComponent string, sapOrderCode string, sapComponentCode string) ([]msDosingComponent, error) {
	var data = []msDosingComponent{}
	// Obtenemos el activo por la linea de la fabrica
	// assetOrder, err := s.repositoryAss.AssetByFactLine(factory, prodline)
	// if err != nil {
	// 	log.Println("Activo no detectado Service DosingConsumptionUpdate:", err)
	// 	return data, err
	// }

	consumptions, err := s.repositoryOrd.ConsumptionComponentUpdate(sapOrderCode, sapComponentCode, factory, prodline, dosingUnit, dosingComponent)
	if err != nil {
		log.Println("Error actualizacion Service ConsumptionComponentUpdate:", err)
		return data, err
	}
	for _, c := range consumptions {
		// Verificar si las fechas son válidas (no zero time)
		hasCreatedAt := !c.CreatedAt.IsZero()
		hasUpdatedAt := !c.UpdatedAt.IsZero()
		log.Printf("📅 Mapeando consumo: Component=%s, CreatedAt=%v (zero=%v), UpdatedAt=%v (zero=%v)", 
			c.MrComponentSapCode, c.CreatedAt, !hasCreatedAt, c.UpdatedAt, !hasUpdatedAt)
		
		data = append(data, msDosingComponent{
			DosingUnit:        c.DosingUnit,
			DosingHopper:      c.Hopper,
			ComponentSapCode:  c.MrComponentSapCode,
			CommittedQuantity: c.CommittedQuantity,
			CreatedAt:         c.CreatedAt,
			UpdatedAt:         c.UpdatedAt,
		})
	}
	return data, nil
}

func (s *service) DosingConsumptionCalculate(factory string, prodline string, sapOrderCode string, startDate *time.Time, endDate *time.Time) ([]msDosingComponent, error) {
	var data = []msDosingComponent{}
	var compInflux = []riInfluxdb.MriDosingComponent{}
	var startedAt, finishedAt time.Time
	var err error

	// Si se proporcionan fechas en los headers, usarlas; si no, obtenerlas desde la BD
	if startDate != nil && endDate != nil {
		startedAt = *startDate
		finishedAt = *endDate
		log.Println("✅ Usando fechas proporcionadas en headers:")
		log.Println("startedAt:", startedAt)
		log.Println("finishedAt:", finishedAt)
	} else {
		// Obtener fechas desde la BD como antes
		startedAt, finishedAt, err = s.repositoryOrd.LineOrdersFindStartFinish(factory, prodline, sapOrderCode)
		if err != nil {
			log.Println("Error actualizacion Service LineOrdersFindStartFinish:", err)
			return data, err
		}
		log.Println("✅ Usando fechas desde BD:")
		log.Println("starteddAt:", startedAt)
		log.Println("finishedAt:", finishedAt)
	}

	// Validar que las fechas sean válidas (no sean fecha cero)
	zeroTime := time.Time{}
	if startedAt.Equal(zeroTime) || finishedAt.Equal(zeroTime) {
		log.Println("❌ Error: Las fechas de inicio o fin son inválidas (fecha cero)")
		log.Println("startedAt:", startedAt)
		log.Println("finishedAt:", finishedAt)
		return data, fmt.Errorf("las fechas de inicio y fin de la orden de fabricación no están configuradas. Por favor, configure las fechas de Inicio OF y Fin OF antes de calcular los consumos")
	}

	// Validar que la fecha de inicio sea anterior a la fecha de fin
	if startedAt.After(finishedAt) || startedAt.Equal(finishedAt) {
		log.Println("❌ Error: La fecha de inicio es posterior o igual a la fecha de fin")
		log.Println("startedAt:", startedAt)
		log.Println("finishedAt:", finishedAt)
		return data, fmt.Errorf("la fecha de inicio debe ser anterior a la fecha de fin")
	}

	consumptions, err := s.repositoryOrd.ConsumptionByOrder(sapOrderCode, factory, prodline)
	if err != nil {
		log.Println("Error lectura listado Service DosingConsumptionList:", err)
		return data, err
	}

	log.Println("consumptionsjjjjjjjj:", consumptions)

	for _, c := range consumptions {
		compInflux = append(compInflux, riInfluxdb.MriDosingComponent{
			DosingUnit:   c.DosingUnit,
			DosingHopper: c.Hopper,
			Quantity:     0, //c.CommittedQuantity,
		})
	}
	// ANTES de llamar a OrderConsumptionCalculate
	log.Println("🔍 === VERIFICANDO compInflux ===")
	log.Printf("compInflux es nil: %t", compInflux == nil)
	log.Printf("Longitud de compInflux: %d", len(compInflux))

	if len(compInflux) == 0 {
		log.Println("❌ compInflux está VACÍO - Revisar cómo se crea este slice")

		// Debug: verificar los consumptions que deberían convertirse a compInflux
		log.Println("📊 === CONSUMPTIONS ACTUALES ===")
		for i, consumption := range consumptions {
			log.Printf("[%d] DosingUnit: '%s', Hopper: '%s'",
				i, consumption.DosingUnit, consumption.Hopper)
		}
	}
	doserComp, err := s.repositoryInflux.OrderConsumptionCalculate(factory, prodline, compInflux, startedAt, finishedAt)
	if err != nil {
		log.Printf("❌ ERROR en OrderConsumptionCalculate: %v", err)
		return nil, err
	}

	log.Println("📋 === DOSERCOMP RETORNADO ===")
	log.Printf("Cantidad de elementos en doserComp: %d", len(doserComp))

	for i, comp := range doserComp {
		log.Printf("[%d] DosingUnit: '%s', DosingHopper: '%s', Quantity: %.2f",
			i, comp.DosingUnit, comp.DosingHopper, comp.Quantity)
	}

	log.Println("🔍 === COMPARANDO CON CONSUMPTIONS ===")
	for i, consumption := range consumptions {
		log.Printf("Consumption [%d]: DosingUnit: '%s', Hopper: '%s'",
			i, consumption.DosingUnit, consumption.Hopper)

		for j, mri := range doserComp {
			if consumption.DosingUnit == mri.DosingUnit && consumption.Hopper == mri.DosingHopper {
				log.Printf("   ✅ COINCIDENCIA con doserComp[%d]: Quantity %.2f", j, mri.Quantity)
				consumptions[i].CommittedQuantity = mri.Quantity
			}
		}
	}

	log.Println("📊 === CONSUMPTIONS FINAL ===")
	for i, consumption := range consumptions {
		log.Printf("[%d] DosingUnit: %s, Hopper: %s, CommittedQuantity: %.2f, MrRecipeSapCode: %s",
			i, consumption.DosingUnit, consumption.Hopper, consumption.CommittedQuantity, consumption.MrRecipeSapCode)
	}

	err = s.repositoryOrd.ConsumptionAddReal(consumptions)
	if err != nil {
		log.Println("Error actualizacion consumos en PostgreSQL listado Service ConsumptionAddReal:", err)
		return data, err
	}

	consumptions, err = s.repositoryOrd.ConsumptionByOrder(sapOrderCode, factory, prodline)
	if err != nil {
		log.Println("Error lectura listado Service DosingConsumptionList:", err)
		return data, err
	}
	log.Println("consumptionskkkkkkkkkkkkkkk:", consumptions)

	for _, c := range consumptions {
		// Verificar si las fechas son válidas (no zero time)
		hasCreatedAt := !c.CreatedAt.IsZero()
		hasUpdatedAt := !c.UpdatedAt.IsZero()
		log.Printf("📅 Mapeando consumo: Component=%s, CreatedAt=%v (zero=%v), UpdatedAt=%v (zero=%v)", 
			c.MrComponentSapCode, c.CreatedAt, !hasCreatedAt, c.UpdatedAt, !hasUpdatedAt)
		
		data = append(data, msDosingComponent{
			DosingUnit:        c.DosingUnit,
			DosingHopper:      c.Hopper,
			ComponentSapCode:  c.MrComponentSapCode,
			CommittedQuantity: c.CommittedQuantity,
			CreatedAt:         c.CreatedAt,
			UpdatedAt:         c.UpdatedAt,
		})
	}

	return data, nil
}
