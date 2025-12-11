package rModels

import (
	"time"

	"gorm.io/gorm"
)

type MrProductionOrder struct {
	gorm.Model
	Factory                   string `gorm:"type:char(32);not null"`
	ProdLine                  string `gorm:"type:char(32);not null"`
	OrderNumber               string `gorm:"type:char(32);unique"`
	OrderNType                string `gorm:"type:char(32);not null"`
	ProductName               string `gorm:"type:char(32);not null"`
	ProductDescription        string `gorm:"type:char(256);not null"`
	QuantityToProduce         string `gorm:"type:char(32);not null"`
	QuantityProduced          string `gorm:"type:char(32);not null"`
	QuantityRemainedToProduce string `gorm:"type:char(32);not null"`
	MeasurementUnit           string `gorm:"type:char(32);not null"`
	StarteddAt                time.Time
	FinishedAt                time.Time
}

type MrConsumption struct {
	MrRecipeSapCode    string  `gorm:"type:varchar(100);not null;uniqueIndex:idx_unique_consumption,where:deleted_at IS NULL"`
	MrComponentSapCode string  `gorm:"type:varchar(100);not null"`
	Factory            string  `gorm:"type:varchar(32);not null;check:char_length(factory) > 0;uniqueIndex:idx_unique_consumption,where:deleted_at IS NULL"`
	ProdLine           string  `gorm:"type:varchar(32);not null;check:char_length(prod_line) > 0;uniqueIndex:idx_unique_consumption,where:deleted_at IS NULL"`
	DosingUnit         string  `gorm:"type:varchar(32);not null;check:char_length(dosing_unit) > 0;uniqueIndex:idx_unique_consumption,where:deleted_at IS NULL"`
	Hopper             string  `gorm:"type:varchar(32);not null;check:char_length(hopper) > 0;uniqueIndex:idx_unique_consumption,where:deleted_at IS NULL"`
	CommittedQuantity  float32 `gorm:"type:float"`
	CreatedAt          time.Time `gorm:"column:created_at"`
	UpdatedAt          time.Time `gorm:"column:updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index"`
}

type MrRecipe struct {
	SapCode     string `gorm:"primaryKey"`
	Description string `gorm:"type:char(128);not null"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt      `gorm:"index"`
	Components  []MrComponent       `gorm:"many2many:mr_recipe_components;"`
	Relations   []MrRecipeComponent `gorm:"foreignKey:MrRecipeSapCode"`
}

type MrComponent struct {
	SapCode     string `gorm:"primaryKey"`
	Description string `gorm:"size:255;not null"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt      `gorm:"index"`
	Recipies    []MrRecipe          `gorm:"many2many:mr_recipe_components;"`
	Relations   []MrRecipeComponent `gorm:"foreignKey:MrComponentSapCode"`
}

type MrRecipeComponent struct {
	MrRecipeSapCode    string `gorm:"primaryKey"`
	MrComponentSapCode string `gorm:"primaryKey"`
	RequiredQuantity   string `gorm:"type:char(32)"`
	MeasurementUnitRQ  string `gorm:"type:char(32)"`
	CommittedQuantity  string `gorm:"type:char(32)"`
	MeasurementUnitCQ  string `gorm:"type:char(32)"`
	WithDrawnQuantity  string `gorm:"type:char(32)"`
	CreatedAt          time.Time
	UpdatedAt          time.Time
	DeletedAt          gorm.DeletedAt  `gorm:"index"`
	Consumptions       []MrConsumption `gorm:"foreignKey:MrRecipeSapCode,MrComponentSapCode"`
}
