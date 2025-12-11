package sSap

import (
	"time"

	"github.com/remrafvil/Auriga_API/internal/repositories/rAssets"
	"github.com/remrafvil/Auriga_API/internal/repositories/rLineOrders"
	"github.com/remrafvil/Auriga_API/internal/repositories/riInfluxdb"
	"github.com/remrafvil/Auriga_API/internal/repositories/rsSap"
)

type SAPSendResult struct {
	ComponentSapCode string `json:"componentSapCode"`
	DosingUnit       string `json:"dosingUnit"`
	Success          bool   `json:"success"`
	ErrorMessage     string `json:"errorMessage,omitempty"`
	StatusCode       int    `json:"statusCode,omitempty"`
}

type Service interface {
	LineOrderList(factory string, lineNumber string, lineSapCode string, sapRequest string) ([]msProductionOrder, error)
	LineOrderStartFinish(factory string, lineNumber string, lineSapCode string, sapRequest string, orderNumber string, startFinish string) ([]msProductionOrder, error)
	LineOrderUpdateTime(factory string, lineNumber string, lineSapCode string, sapRequest string, orderNumber string, starteddAt time.Time, finishedAt time.Time) ([]msProductionOrder, error)

	RecipeComponentList(sapOrderCode string, sapRequest string) (msRecipe, error)

	DosingConsumptionList(factory string, prodline string, system string, sapOrderCode string, sapRequest string) ([]msDosingComponent, error)
	DosingConsumptionAdd(factory string, prodline string, dosingSystem string, dosingUnit string, dosingComponent string, sapOrderCode string, sapComponentCode string) ([]msDosingComponent, error)
	DosingConsumptionDel(factory string, prodline string, dosingSystem string, dosingUnit string, dosingComponent string, sapOrderCode string, sapComponentCode string) ([]msDosingComponent, error)
	DosingConsumptionUpdate(factory string, prodline string, dosingSystem string, dosingUnit string, dosingComponent string, sapOrderCode string, sapComponentCode string) ([]msDosingComponent, error)
	DosingConsumptionCalculate(factory string, prodline string, sapOrderCode string, startDate *time.Time, endDate *time.Time) ([]msDosingComponent, error)
	DosingConsumptionSendToSAP(factory string, prodline string, sapOrderCode string, startDate *time.Time, endDate *time.Time, workdayID string, turno string) ([]SAPSendResult, error)
}

type service struct {
	repositoryAss    rAssets.Repository
	repositoryOrd    rLineOrders.Repository
	repositorySap    rsSap.Repository
	repositoryInflux riInfluxdb.Repository
}

func New(repositoryAss rAssets.Repository, repositoryOrd rLineOrders.Repository, repositorySap rsSap.Repository, repositoryInflux riInfluxdb.Repository) Service {
	return &service{
		repositoryAss:    repositoryAss,
		repositoryOrd:    repositoryOrd,
		repositorySap:    repositorySap,
		repositoryInflux: repositoryInflux,
	}
}
