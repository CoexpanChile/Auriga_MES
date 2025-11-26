package sAssets

import (
	"context"
	"log"

	"github.com/remrafvil/Auriga_API/internal/repositories/rAssets"
	"github.com/remrafvil/Auriga_API/internal/repositories/rModels"
	"go.uber.org/zap"
)

type Service interface {
	AssetInfo(id uint) (*msAssetTree, error)
	AssetInfoDetail(id uint) (*msAssetLong, error)
	AssetList(ctx context.Context) ([]msAssetTree, error)
	GetAssetWithSimplifiedProduct(assetID uint) (msAssetLong, error)
	GetAssetHierarchy(assetID uint) (*msAssetHierarchy, error)
	GetDosingSystemByLine(ctx context.Context, lineID uint) ([]msDosingUnit, error)
	GetDoserComponents(ctx context.Context, doserID uint) ([]msComponetUnit, error)
}

// service implementación
type service struct {
	repository rAssets.Repository
	logger     *zap.Logger
}

func New(repository rAssets.Repository, logger *zap.Logger) Service {
	return &service{
		repository: repository,
		logger:     logger,
	}
}

/* // Result para FX output
type Result struct {
	fx.Out

	Service Service `group:"services"` // Puedes usar group si necesitas múltiples servicios
}

// Params para FX input
type Params struct {
	fx.In

	Repository       rAssets.Repository
	ContextExtractor auth.ContextExtractor
	Logger           *zap.Logger
}

// El constructor debe devolver la interfaz Service
func New(p Params) Result {
	return Result{
		Service: &service{ // Asegúrate de que &service implemente Service
			repository:       p.Repository,
			contextExtractor: p.ContextExtractor,
			logger:           p.Logger,
		},
	}
} */

type msAssetTree struct {
	ID       uint
	ParentID *uint
	Code     string
}

func (s *service) AssetInfo(id uint) (*msAssetTree, error) {
	rData, err := s.repository.AssetInfo(id)
	if err != nil {
		log.Println("Error service aqui:", err)
		return nil, err
	}
	data := &msAssetTree{
		ID:       rData.ID,
		ParentID: rData.ParentID,
		Code:     rData.Code,
	}
	return data, nil
}

func (s *service) GetAssetHierarchy(id uint) (*msAssetHierarchy, error) {
	rData, err := s.repository.AssetInfo(id)
	if err != nil {
		log.Println("Error service aqui:", err)
		return nil, err
	}
	var hierarchicalLevel []string
	if rData.HierarchicalLevel != nil {
		hierarchicalLevel = rData.HierarchicalLevel
	} else {
		hierarchicalLevel = []string{}
	}
	data := &msAssetHierarchy{
		ID:                rData.ID,
		ProductID:         rData.ProductID,
		ParentID:          rData.ParentID,
		Location:          rData.Location,
		TechCode:          rData.TechCode,
		Code:              rData.Code,
		Sn:                rData.Sn,
		SapCode:           rData.SapCode,
		HierarchicalLevel: hierarchicalLevel,
	}
	return data, nil
}

/* func (s *service) AssetList(ctx context.Context) ([]msAssetTree, error) {
	var data = []msAssetTree{}
	var rData []rModels.MrAsset // Declarar rData fuera de los bloques if/else
	var err error
	log.Println("*****************      Llego por aquí SERVICE *****************")
	userName, orgName, err := s.contextExtractor.GetUserAndOrgNameFromContext(ctx)
	if err != nil {
		// Si falla, continuar pero loguear el error
		s.logger.Warn("Failed to get user info from context", zap.Error(err))
	} else {
		s.logger.Info("Handler Assets User and Org",
			zap.String("user", userName),
			zap.String("org", orgName))
	}

	if orgName == "CX" {
		rData = s.repository.AssetList(ctx) // Corregido: falta la variable rData
		// Nota: AssetList debería retornar ([]rModels.MrAsset, error) para ser consistente
		// Si AssetList no retorna error, necesitas manejar esto diferente
	} else {
		rData, err = s.repository.AssetListByParentCode(orgName, ctx)
		if err != nil {
			log.Println("Error service aqui:", err)
			return nil, err
		}
	}

	log.Println("*****************      Llego por aquí ASSET SERVICE 2 *****************")
	for _, p := range rData {
		data = append(data, msAssetTree{
			ID:       p.ID,
			ParentID: p.ParentID,
			Code:     p.Code,
		})
	}
	log.Println("*****************      Llego por aquí ASSET SERVICE 3 *****************")
	return data, nil
} */

func (s *service) AssetList(ctx context.Context) ([]msAssetTree, error) {
	// ✅ Obtener factory_names del contexto estándar
	factoryNames, _ := ctx.Value("factory_names").([]string)
	userID, _ := ctx.Value("user_id").(string)
	userName, _ := ctx.Value("user_name").(string)

	s.logger.Info("Processing asset list request",
		zap.String("service", "AssetList"),
		zap.String("user_id", userID),
		zap.String("user_name", userName),
		zap.Strings("factory_names", factoryNames))

	var data []msAssetTree
	var rData []rModels.MrAsset
	var err error

	// ✅ NUEVA LÓGICA: Verificar si contiene "CX" o múltiples fábricas
	if containsCX(factoryNames) {
		s.logger.Debug("Fetching all assets (CX in factory_names)",
			zap.String("service", "AssetList"),
			zap.Strings("factory_names", factoryNames))

		rData = s.repository.AssetList(ctx)
	} else if len(factoryNames) > 0 {
		s.logger.Debug("Fetching assets by multiple parent codes",
			zap.String("service", "AssetList"),
			zap.Strings("parentCodes", factoryNames),
			zap.Int("count", len(factoryNames)))

		// ✅ Llamar al NUEVO método del repository para múltiples códigos padre
		rData, err = s.repository.AssetListByParentCodes(factoryNames, ctx)
		if err != nil {
			s.logger.Error("Failed to fetch assets by parent codes",
				zap.Error(err),
				zap.String("service", "AssetList"),
				zap.Strings("parentCodes", factoryNames),
				zap.String("user_id", userID))
			return nil, err
		}

		s.logger.Debug("Retrieved assets by parent codes",
			zap.Int("count", len(rData)),
			zap.String("service", "AssetList"),
			zap.Strings("parentCodes", factoryNames))
	} else {
		// Caso por defecto: si no hay factory_names, obtener todos los activos
		s.logger.Debug("No factory names found, fetching all assets",
			zap.String("service", "AssetList"))
		rData = s.repository.AssetList(ctx)
	}

	// Transformación de datos
	for _, p := range rData {
		data = append(data, msAssetTree{
			ID:       p.ID,
			ParentID: p.ParentID,
			Code:     p.Code,
		})
	}

	s.logger.Info("Asset list processing completed",
		zap.Int("totalAssets", len(data)),
		zap.String("service", "AssetList"),
		zap.String("user_id", userID),
		zap.String("user_name", userName),
		zap.Strings("factory_names", factoryNames))

	return data, nil
}

// ✅ Función helper para verificar si contiene "CX"
func containsCX(factoryNames []string) bool {
	for _, name := range factoryNames {
		if name == "CX" {
			return true
		}
	}
	return false
}
