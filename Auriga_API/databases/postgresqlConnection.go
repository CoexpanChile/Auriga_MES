package databases

import (
	"context"
	"fmt"
	"log"

	"github.com/remrafvil/Auriga_API/config"
	// Imports comentados temporalmente - se usan en migraciones comentadas
	// "github.com/remrafvil/Auriga_API/internal/repositories/rAssets"
	// "github.com/remrafvil/Auriga_API/internal/repositories/rEvents"
	// "github.com/remrafvil/Auriga_API/internal/repositories/rInfluxQuery"
	// "github.com/remrafvil/Auriga_API/internal/repositories/rModels"
	// "github.com/remrafvil/Auriga_API/internal/repositories/rOthers"
	// "github.com/remrafvil/Auriga_API/internal/repositories/rProducts"
	// "github.com/remrafvil/Auriga_API/internal/repositories/rProducts/rP_CXC_L8"
	// "github.com/remrafvil/Auriga_API/internal/repositories/rProducts/rP_General"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func New(s *config.Settings, ctx context.Context) (*gorm.DB, error) {

	connectionString := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%d sslmode=disable TimeZone=%s",
		s.DB.Host,
		s.DB.User,
		s.DB.Password,
		s.DB.Name,
		s.DB.Port,
		s.DB.Timezone,
	)
	log.Println(connectionString)

	//db, err := gorm.Open(mysql.Open(connectionString), &gorm.Config{})

	//dsn := "host=localhost user=jr password=lHevDgr_aqHDlBOpQirf28 dbname=CXP_installed_base port=33307 sslmode=disable TimeZone=Europe/Madrid"
	//dsn := "host=192.168.8.203 user=tdfsp password=lHevDgr_aqHDlBOpQirf28 dbname=InstalledBase port=33307 sslmode=disable TimeZone=Europe/Madrid"
	// TEST NEW ASSET
	//dsn := "host=18.232.248.24 user=tdcx password=VwFODDerW8PK_vsAq6Fs31 dbname=CX_OT_CX port=33307 sslmode=disable TimeZone=America/New_York"
	//dsn := "host=18.213.58.26 user=jr password=lHevDgr_aqHDlBOpQirf28 dbname=InstalledBase port=33307 sslmode=disable TimeZone=Europe/Madrid"
	//dsn := "host=18.213.58.26 user=tdcx password=VwFODDerW8PK_vsAq6Fs31 dbname=CX_OT_CX port=33307 sslmode=disable TimeZone=UTC"

	db, err := gorm.Open(postgres.Open(connectionString), &gorm.Config{})
	if err != nil {
		dbConnectionMessage := fmt.Sprintf("Database - %s - Connection Failure:%s", s.DB.Name, err)
		log.Println(dbConnectionMessage)
		return db, err
	}
	dbConnectionMessage := fmt.Sprintf("Database - %s - Connection Successfully", s.DB.Name)
	log.Println(dbConnectionMessage)
	db.Logger = logger.Default.LogMode(logger.Info)

	log.Println("Running Migrations")

	/*
	db.AutoMigrate(&rModels.MrProductionOrder{})
	db.AutoMigrate(&rModels.MrRecipe{}, &rModels.MrComponent{}, &rModels.MrRecipeComponent{}, &rModels.MrConsumption{})

	db.AutoMigrate(&rModels.MrEventCategory{}, &rModels.MrEventType{})
	rEvents.DB_InitEventsCategory(db)
	//db.AutoMigrate(&rModels.MrRawEvents{})
	db.AutoMigrate(&rModels.MrCommitEvents{})

	db.AutoMigrate(&rOthers.MrGrafanaDashboards{})
	rOthers.DB_InitGrafanaDashboards(db)
	db.AutoMigrate(&rModels.MrInfluxGrafanaQuery{})
	rInfluxQuery.InfluxQueryInitToCreate(db)
	// Auto-migrar modelos de auth
	// err = db.AutoMigrate(&rModels.User{})
	// if err != nil {
	// 	return nil, err
	// }

	// Migrar todas las tablas en orden correcto
	tables := []interface{}{

	   		&rModels.MrFactory{},
	   		&rModels.MrDepartment{},
	   		&rModels.MrFactoryDepartment{},
	   		&rModels.MrEmployeeAuthentikRole{},
	   		&rModels.MrEmployee{},
	   		&rModels.MrEmployeeFactoryDepartment{},
	   		&rModels.MrAttendance{},
	   		&rModels.MrShift{},
	   		&rModels.MrShiftAssignment{},
	   		&rModels.MrTeam{},
	   		&rModels.MrTeamMember{},

	   		// Nuevos modelos de mantenimiento
	   		&rModels.MrMaintenancePlan{},
	   		&rModels.MrMaintenanceProcedure{},
	   		&rModels.MrMaintenanceSparePart{},
	   		&rModels.MrMaintWorkOrder{},
	   		&rModels.MrMaintWorkOrderAssignment{},
	   		&rModels.MrMaintWorkOrderTask{},
	   		&rModels.MrMaintWorkOrderSparePart{},
	   		&rModels.MrSparePartStock{},
	   		&rModels.MrAssetRegisterMovement{},
	   		&rModels.MrPurchaseOrder{},
	   		&rModels.MrPurchaseOrderItem{},
	   	}

	for _, table := range tables {
		if err := db.AutoMigrate(table); err != nil {
			log.Printf("Advertencia migrando tabla: %v", err)
			// Continuar a pesar del error
		}
	}
	//db.AutoMigrate(&rModels.Employee{})

	//****************************************MIGRATION NUEVO ASSETS Y PRODUCTOS *********************************************

	db.AutoMigrate(&rModels.MrProductType{}, &rModels.MrProductFeatureType{}, &rModels.MrProductFeatureTypeRelation{}, &rModels.MrProduct{}, &rModels.MrProductFeatureValue{}, &rModels.MrAsset{}, &rModels.MrDocuments{})

	   	if err := rProducts.CreateMultipleProductTypes(db, rP_General.ProductTypesData); err != nil {
	   		log.Fatalf("Error al crear tipos de productos: %v", err)
	   	}
	   	// Crear múltiples productos con valores
	   	if err := rProducts.CreateMultipleProductsWithValues(db, rP_General.FactoriesToCreate); err != nil {
	   		log.Fatalf("Error al crear los fábricas: %v", err)
	   	}
	   	log.Println("fábricas creados exitosamente!")

	   	if err := rProducts.CreateMultipleProductsWithValues(db, rP_General.ExtrusionLinesToCreate); err != nil {
	   		log.Fatalf("Error al crear los lineas de extrusión: %v", err)
	   	}
	   	log.Println("lineas de extrusión creados exitosamente!")

	   	if err := rProducts.CreateMultipleProductsWithValues(db, rP_General.LinePartsToCreate); err != nil {
	   		log.Fatalf("Error al crear los partes de líneas: %v", err)
	   	}
	   	log.Println("partes de líneas creados exitosamente!")

	   	if err := rProducts.CreateMultipleProductsWithValues(db, rP_General.EquipmentToCreate); err != nil {
	   		log.Fatalf("Error al crear los equipments: %v", err)
	   	}
	   	log.Println("equipments creados exitosamente!")

	   	if err := rProducts.CreateMultipleProductsWithValues(db, rP_General.MotorsToCreate); err != nil {
	   		log.Fatalf("Error al crear los motors: %v", err)
	   	}
	   	log.Println("Motors creados exitosamente!")

	   	if err := rProducts.CreateMultipleProductsWithValues(db, rP_General.DrivesToCreate); err != nil {
	   		log.Fatalf("Error al crear los drives: %v", err)
	   	}
	   	log.Println("Drives creados exitosamente!")

	   	if err := rProducts.CreateMultipleProductsWithValues(db, rP_CXC_L8.CXC_L8_ProductsToCreate); err != nil {
	   		log.Fatalf("Error al crear los drives: %v", err)
	   	}
	   	log.Println("Drives creados exitosamente!")

	   	// Crear múltiples activos

	   	if err := rAssets.CreateMultipleAssets(db, rAssets.AssetsToCreate); err != nil {
	   		fmt.Printf("Error al crear activos: %v\n", err)
	   	} else {
	   		fmt.Println("Activos creados exitosamente")
	   	}

	   	if err := rAssets.CreateMultipleAssets(db, rAssets.AssetsToCreate1); err != nil {
	   		fmt.Printf("Error al crear activos: %v\n", err)
	   	} else {
	   		fmt.Println("Activos creados exitosamente")
	   	}

	   	if err := CreateMultipleAssets_CXC_L8(db); err != nil {
	   		fmt.Printf("Error al crear activos: %v\n", err)
	   	} else {
	   		fmt.Println("Activos creados exitosamente")
	   	}
	*/

	// DOCUMENTOS

	// if _, err := rDocuments.CrearMultipleDocuments(db, rD_paperless.DocumnetsToCreate_Paperless2); err != nil {
	// 	fmt.Printf("Error al crear documentos: %v\n", err)
	// } else {
	// 	fmt.Println("Documentos creados exitosamente")
	// }

	//rDocuments.AsignarDocumentosAProductoPorNombre(db, "ACS880-104-0035A-5", []string{"ABB_ACS880_HardwareManual"})
	//rDocuments.AsignarDocumentosAProductoPorNombre(db, "3GEB162752-HDA", []string{"ABB_HDP_Manual"})

	// if err := rDocuments.AsignarDocumentosAActivoPorTechCode(db, 111111111111, []string{"TP-CXC-22-013_L8_WindersElectricalDrawings_v1_230516", "TP-CXC-22-013_L8_WindersCabinetsLayOut_v1_221209"}); err != nil {
	// 	fmt.Printf("Error al asignar los documentos al activo: %v\n", err)
	// } else {
	// 	fmt.Println("Documentos asignados exitosamente al activo")
	// }

	return db, err
}
