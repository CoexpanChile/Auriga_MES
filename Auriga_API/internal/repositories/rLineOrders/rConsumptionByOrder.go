package rLineOrders

// lo llamaremso repositories

import (
	"errors"
	"fmt"
	"time"

	"github.com/remrafvil/Auriga_API/internal/repositories/rModels"
	"gorm.io/gorm"
)

func (m *repository) ConsumptionByOrder(recipeSapCode string, factory string, prodLine string) ([]rModels.MrConsumption, error) {
	var consumptions []rModels.MrConsumption
	if err := m.db.Where("mr_recipe_sap_code = ? AND factory = ? AND prod_line = ?",
		recipeSapCode, factory, prodLine).Order("factory ASC, prod_line ASC, dosing_unit ASC, hopper ASC").Find(&consumptions).Error; err != nil {
		return consumptions, errors.New("no se pudo encontrar el dato")
	}
	
	// Log para verificar fechas leídas desde BD
	fmt.Printf("📥 [ConsumptionByOrder] Leídos %d consumos desde BD\n", len(consumptions))
	for i, c := range consumptions {
		fmt.Printf("  [%d] Component=%s, CreatedAt=%v (IsZero=%v), UpdatedAt=%v (IsZero=%v)\n",
			i, c.MrComponentSapCode, c.CreatedAt, c.CreatedAt.IsZero(), c.UpdatedAt, c.UpdatedAt.IsZero())
	}
	
	return consumptions, nil
}

func (m *repository) ConsumptionComponentAdd(recipeSapCode string, sapComponentCode string, factory string, prodLine string, dosingUnit string, dosingComponent string) ([]rModels.MrConsumption, error) {
	var consumptions []rModels.MrConsumption

	newConsumption := rModels.MrConsumption{
		MrRecipeSapCode:    recipeSapCode,
		MrComponentSapCode: sapComponentCode,
		Factory:            factory,
		ProdLine:           prodLine,
		DosingUnit:         dosingUnit,
		Hopper:             dosingComponent,
		CommittedQuantity:  0.0,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	err := m.db.Create(&newConsumption).Error
	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			fmt.Println("Record already exists")
			// Aquí puedes actualizar el existente si lo prefieres
		} else {
			fmt.Println("Error inserting data:", err)
		}
		return consumptions, err
	}

	fmt.Println("Record inserted successfully")
	return consumptions, nil
}

func (m *repository) ConsumptionComponentDel(recipeSapCode string, sapComponentCode string, factory string, prodLine string, dosingUnit string, dosingComponent string) ([]rModels.MrConsumption, error) {
	var consumptions []rModels.MrConsumption
	delConsumption := rModels.MrConsumption{
		MrRecipeSapCode:    recipeSapCode,
		MrComponentSapCode: sapComponentCode,
		Factory:            factory,
		ProdLine:           prodLine,
		DosingUnit:         dosingUnit,
		Hopper:             dosingComponent,
	}
	// Insertar el registro en la base de datos

	result := m.db.Where(&delConsumption).Delete(&delConsumption)

	if result.Error != nil {
		fmt.Println("Error deleting record:", result.Error)
		return consumptions, result.Error
	} else if result.RowsAffected == 0 {
		fmt.Println("No record found to delete")
	} else {
		fmt.Println("Record deleted successfully")
	}
	return consumptions, nil
}

func (m *repository) ConsumptionComponentUpdate(recipeSapCode string, sapComponentCode string, factory string, prodLine string, dosingUnit string, dosingComponent string) ([]rModels.MrConsumption, error) {
	var consumptions []rModels.MrConsumption

	updateConsumption := rModels.MrConsumption{
		MrRecipeSapCode: recipeSapCode,
		// MrComponentSapCode: sapComponentCode,
		Factory:    factory,
		ProdLine:   prodLine,
		DosingUnit: dosingUnit,
		Hopper:     dosingComponent,
	}
	// Insertar el registro en la base de datos
	newMrComponentSapCode := sapComponentCode

	result := m.db.Model(&rModels.MrConsumption{}).
		Where("mr_recipe_sap_code = ? AND factory = ? AND prod_line = ? AND dosing_unit = ? AND hopper = ?",
			updateConsumption.MrRecipeSapCode,
			updateConsumption.Factory,
			updateConsumption.ProdLine,
			updateConsumption.DosingUnit,
			updateConsumption.Hopper,
		).
		Update("mr_component_sap_code", newMrComponentSapCode)

	if result.Error != nil {
		fmt.Println("Error updating record:", result.Error)
		return consumptions, result.Error
	} else if result.RowsAffected == 0 {
		fmt.Println("No record found to update")
	} else {
		fmt.Println("Record updated successfully")
	}
	return consumptions, nil
}

func (m *repository) ConsumptionAddReal(realConsumptions []rModels.MrConsumption) error {
	for _, record := range realConsumptions {
		result := m.db.Model(&rModels.MrConsumption{}).
			Where("mr_recipe_sap_code = ? AND factory = ? AND prod_line = ? AND dosing_unit = ? AND hopper = ?",
				record.MrRecipeSapCode, record.Factory, record.ProdLine, record.DosingUnit, record.Hopper).
			Update("committed_quantity", record.CommittedQuantity)

		if result.Error != nil {
			fmt.Errorf("error updating record for MrRecipeSapCode=%s, Factory=%s, ProdLine=%s, DosingUnit=%s, Hopper=%s: %w",
				record.MrRecipeSapCode, record.Factory, record.ProdLine, record.DosingUnit, record.Hopper, result.Error)
			return result.Error
		}

		if result.RowsAffected == 0 {
			fmt.Errorf("no rows updated for MrRecipeSapCode=%s, Factory=%s, ProdLine=%s, DosingUnit=%s, Hopper=%s",
				record.MrRecipeSapCode, record.Factory, record.ProdLine, record.DosingUnit, record.Hopper)
			return result.Error
		}
	}
	return nil
}
