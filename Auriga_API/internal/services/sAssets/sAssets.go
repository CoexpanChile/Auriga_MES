package sAssets

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/remrafvil/Auriga_API/internal/repositories/rAssets"
	"github.com/remrafvil/Auriga_API/internal/repositories/rModels"
	"github.com/remrafvil/Auriga_API/internal/repositories/riInfluxdb"
	"github.com/remrafvil/Auriga_API/internal/utils"
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
	GetLinesStatus(ctx context.Context, factory string, lineCodes []string) (map[string]riInfluxdb.LineStatusResponse, error)
	GetLineThroughput(ctx context.Context, factory string, lineCode string, startTime time.Time, stopTime time.Time, windowPeriod string) ([]riInfluxdb.ThroughputData, error)
	GetLineInfo(ctx context.Context, factory string) ([]msLineInfo, error)
}

// service implementación
type service struct {
	repository     rAssets.Repository
	repositoryInflux riInfluxdb.Repository
	logger         *zap.Logger
}

func New(repository rAssets.Repository, repositoryInflux riInfluxdb.Repository, logger *zap.Logger) Service {
	return &service{
		repository:     repository,
		repositoryInflux: repositoryInflux,
		logger:         logger,
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
	// Obtener factory_names del contexto estándar
	factoryNames, _ := utils.GetFactoryNames(ctx)
	userID, _ := utils.GetUserID(ctx)

	s.logger.Debug("Processing asset list request",
		zap.String("service", "AssetList"),
		zap.String("user_id", userID),
		zap.Strings("factory_names", factoryNames))

	var data []msAssetTree
	var rData []rModels.MrAsset
	var err error

	// Seguridad: Validar que el usuario tenga fábricas asignadas
	if len(factoryNames) == 0 {
		s.logger.Warn("No factory names found in context, returning empty list",
			zap.String("service", "AssetList"),
			zap.String("user_id", userID))
		return []msAssetTree{}, nil
	} else if containsCX(factoryNames) {
		rData = s.repository.AssetList(ctx)
	} else {
		rData, err = s.repository.AssetListByParentCodes(factoryNames, ctx)
		if err != nil {
			s.logger.Error("Failed to fetch assets by parent codes",
				zap.Error(err),
				zap.String("service", "AssetList"),
				zap.Strings("parentCodes", factoryNames),
				zap.String("user_id", userID))
			return nil, err
		}
	}

	// Filtro de seguridad: Filtrar activos por fábricas permitidas
	if len(factoryNames) == 0 {
		return []msAssetTree{}, nil
	}

	if containsCX(factoryNames) {
		for _, p := range rData {
			data = append(data, msAssetTree{
				ID:       p.ID,
				ParentID: p.ParentID,
				Code:     p.Code,
			})
		}
		return data, nil
	}

	if len(rData) == 0 {
		return []msAssetTree{}, nil
	}

	// Aplicar filtrado estricto
	{
		allowedFactoryCodes := make(map[string]bool)
		for _, code := range factoryNames {
			allowedFactoryCodes[strings.ToUpper(strings.TrimSpace(code))] = true
		}

		allowedAssetIDs := make(map[uint]bool)
		allowedRootAssetIDs := make(map[uint]bool)
		rejectedRootAssets := []string{}

		for _, asset := range rData {
			if asset.ParentID == nil {
				assetCodeUpper := strings.ToUpper(strings.TrimSpace(asset.Code))
				if allowedFactoryCodes[assetCodeUpper] {
					allowedRootAssetIDs[asset.ID] = true
					allowedAssetIDs[asset.ID] = true
				} else {
					rejectedRootAssets = append(rejectedRootAssets, asset.Code)
				}
			}
		}

		if len(rejectedRootAssets) > 0 {
			s.logger.Debug("Root assets filtered",
				zap.Int("allowed_count", len(allowedRootAssetIDs)),
				zap.Int("rejected_count", len(rejectedRootAssets)),
				zap.Strings("rejected_codes", rejectedRootAssets))
		}

		// Marcar todos los descendientes de los activos raíz permitidos como permitidos
		for changed := true; changed; {
			changed = false
			for _, asset := range rData {
				if !allowedAssetIDs[asset.ID] && asset.ParentID != nil {
					if allowedAssetIDs[*asset.ParentID] {
						allowedAssetIDs[asset.ID] = true
						changed = true
					}
				}
			}
		}

		// Transformar y filtrar datos - solo incluir activos permitidos
		filteredCount := 0
		for _, p := range rData {
			if allowedAssetIDs[p.ID] {
				data = append(data, msAssetTree{
					ID:       p.ID,
					ParentID: p.ParentID,
					Code:     p.Code,
				})
				filteredCount++
			}
		}

		// Validación adicional: Verificar que no se incluyeron activos no permitidos
		for _, asset := range rData {
			if asset.ParentID == nil {
				assetCodeUpper := strings.ToUpper(strings.TrimSpace(asset.Code))
				if !allowedFactoryCodes[assetCodeUpper] && allowedAssetIDs[asset.ID] {
					s.logger.Error("Security error: Found excluded asset in filtered results",
						zap.String("asset_code", asset.Code),
						zap.Strings("allowed_factories", factoryNames),
						zap.String("user_id", userID))
				}
			}
		}
	}

	s.logger.Info("Asset list processing completed",
		zap.Int("totalAssets", len(data)),
		zap.String("service", "AssetList"),
		zap.String("user_id", userID))

	return data, nil
}

func containsCX(factoryNames []string) bool {
	for _, name := range factoryNames {
		if name == "CX" {
			return true
		}
	}
	return false
}

// GetLinesStatus obtiene el estado de múltiples líneas desde InfluxDB
func (s *service) GetLinesStatus(ctx context.Context, factory string, lineCodes []string) (map[string]riInfluxdb.LineStatusResponse, error) {
	if len(lineCodes) == 0 {
		return make(map[string]riInfluxdb.LineStatusResponse), nil
	}
	
	return s.repositoryInflux.GetLinesStatus(factory, lineCodes)
}

// GetLineThroughput obtiene el throughput de una línea desde InfluxDB
func (s *service) GetLineThroughput(ctx context.Context, factory string, lineCode string, startTime time.Time, stopTime time.Time, windowPeriod string) ([]riInfluxdb.ThroughputData, error) {
	return s.repositoryInflux.GetLineThroughput(factory, lineCode, startTime, stopTime, windowPeriod)
}

// msLineInfo representa la información de una línea de producción
type msLineInfo struct {
	Line       string `json:"line"`
	Factory    string `json:"factory"`
	ID         uint   `json:"id"`
	SapCode    string `json:"sapcode"`
	ProductType string `json:"producttype"`
	Location   string `json:"location"`
}

// GetLineInfo obtiene la información de las líneas de producción filtradas por fábrica
func (s *service) GetLineInfo(ctx context.Context, factory string) ([]msLineInfo, error) {
	// Obtener factory_names del contexto estándar
	factoryNames, _ := utils.GetFactoryNames(ctx)
	userID, _ := utils.GetUserID(ctx)

	s.logger.Debug("Processing line info request",
		zap.String("service", "GetLineInfo"),
		zap.String("requested_factory", factory),
		zap.String("user_id", userID),
		zap.Strings("factory_names", factoryNames))

	var rData []rModels.MrAsset
	var err error

	// Si se especifica una fábrica, filtrar por ella
	if factory != "" {
		// Validar que el usuario tenga acceso a esta fábrica
		hasAccess := false
		if containsCX(factoryNames) {
			hasAccess = true
		} else {
			for _, fn := range factoryNames {
				if strings.ToUpper(strings.TrimSpace(fn)) == strings.ToUpper(strings.TrimSpace(factory)) {
					hasAccess = true
					break
				}
			}
		}

		if !hasAccess {
			s.logger.Warn("User does not have access to requested factory",
				zap.String("requested_factory", factory),
				zap.String("user_id", userID),
				zap.Strings("allowed_factories", factoryNames))
			return []msLineInfo{}, nil
		}

		// Obtener assets de la fábrica específica
		rData, err = s.repository.AssetListByParentCodes([]string{factory}, ctx)
		if err != nil {
			s.logger.Error("Failed to fetch assets by factory",
				zap.Error(err),
				zap.String("factory", factory),
				zap.String("user_id", userID))
			return nil, err
		}
	} else {
		// Si no se especifica fábrica, usar las del usuario
		if containsCX(factoryNames) {
			rData = s.repository.AssetList(ctx)
		} else {
			rData, err = s.repository.AssetListByParentCodes(factoryNames, ctx)
			if err != nil {
				s.logger.Error("Failed to fetch assets by parent codes",
					zap.Error(err),
					zap.Strings("parentCodes", factoryNames),
					zap.String("user_id", userID))
				return nil, err
			}
		}
	}

	// Filtrar solo líneas de producción (hierarchical_level[2] existe y hierarchical_level[3] es NULL)
	// y transformar a msLineInfo
	var result []msLineInfo
	for _, asset := range rData {
		// Verificar que sea una línea de producción
		if len(asset.HierarchicalLevel) >= 2 && (len(asset.HierarchicalLevel) == 2 || asset.HierarchicalLevel[2] == "") {
			factoryName := ""
			if len(asset.HierarchicalLevel) > 0 {
				factoryName = asset.HierarchicalLevel[0]
			}

			productTypeName := ""
			if asset.Product.ID > 0 && asset.Product.ProductType.ID > 0 {
				productTypeName = asset.Product.ProductType.Name
			}

			result = append(result, msLineInfo{
				Line:        asset.Code,
				Factory:     factoryName,
				ID:          asset.ID,
				SapCode:     asset.SapCode,
				ProductType: productTypeName,
				Location:    asset.Location,
			})
		}
	}

	s.logger.Info("Line info processing completed",
		zap.Int("totalLines", len(result)),
		zap.String("service", "GetLineInfo"),
		zap.String("requested_factory", factory),
		zap.String("user_id", userID))

	return result, nil
}
