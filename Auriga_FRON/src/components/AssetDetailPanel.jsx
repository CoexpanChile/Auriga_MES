import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { Loader2, Package, FileText, Info, X, ExternalLink } from 'lucide-react'
import { api } from '../lib/api'

export function AssetDetailPanel({ 
  assetId, 
  assetDetails: externalAssetDetails, // Datos precargados
  loading: externalLoading, // Estado de loading externo
  onClose, 
  isMobile = false 
}) {
  const [internalAsset, setInternalAsset] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Si se pasan datos externos, usarlos directamente
  // Si no, cargar desde API
  useEffect(() => {
    if (externalAssetDetails) {
      setInternalAsset(externalAssetDetails)
      setError(null)
    } else if (assetId && !externalLoading) {
      // Solo cargar si no hay datos externos y no hay loading externo
      loadAssetDetails(assetId)
    } else if (!assetId) {
      setInternalAsset(null)
    }
  }, [assetId, externalAssetDetails, externalLoading])

  const loadAssetDetails = async (id) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await api.get(`/asset/showdetail/${id}`)
      
      // Debug: verificar estructura de documentos
      if (process.env.NODE_ENV === 'development') {
        console.log('Asset data loaded:', {
          hasProduct: !!data.Product,
          hasProductDocuments: !!(data.Product?.Documents),
          productDocumentsCount: data.Product?.Documents?.length || 0,
          hasAssetDocuments: !!data.Documents,
          assetDocumentsCount: data.Documents?.length || 0,
          productDocuments: data.Product?.Documents,
          assetDocuments: data.Documents
        })
      }
      setInternalAsset(data)
    } catch (err) {
      console.error('Error loading asset details:', err)
      if (err.message?.includes('404')) {
        setError('Activo no encontrado')
      } else if (err.message?.includes('403')) {
        setError('No tienes permisos para ver este activo')
      } else {
        setError('Error al cargar detalles del activo')
      }
    } finally {
      setLoading(false)
    }
  }

  // Usar datos externos si están disponibles, sino usar internos
  const asset = externalAssetDetails || internalAsset
  const isLoading = externalLoading !== undefined ? externalLoading : loading

  if (!assetId) {
    return null
  }

  // Renderizar siempre el contenedor cuando hay assetId
  const containerClassName = isMobile 
    ? "fixed inset-0 z-50 bg-gray-900" 
    : "w-full h-full min-h-0 flex"
  
  const cardClassName = isMobile 
    ? "h-full overflow-auto" 
    : "h-full flex flex-col min-h-0 w-full"

  if (isLoading) {
    return (
      <div className={containerClassName}>
        <Card className={cardClassName}>
          <div className="p-8 flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-blue-500" size={48} />
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={containerClassName}>
        <Card className={cardClassName}>
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            {isMobile && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                Cerrar
              </button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className={containerClassName}>
        <Card className={cardClassName}>
          <div className="p-8 text-center text-gray-500">
            <Info size={48} className="mx-auto mb-4 opacity-50" />
            <p>No se encontró información del activo</p>
            {assetId && (
              <p className="text-xs mt-2">Asset ID: {assetId}</p>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      <Card className={cardClassName}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            {asset.Product && (
              <h2 className="text-2xl font-bold text-white mb-2">
                {asset.Product.Manufacturer} — {asset.Product.Name}
              </h2>
            )}
            <div className="space-y-1 text-sm">
              {asset.Product?.ProductTypeName && (
                <p className="text-gray-300">{asset.Product.ProductTypeName}</p>
              )}
              {asset.Product?.Family && (
                <p className="text-gray-400">{asset.Product.Family}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                <span>Location: {asset.Location}</span>
                <span>Code: {asset.Code}</span>
                {asset.SapCode && <span>SAP Code: {asset.SapCode || 'No code'}</span>}
                {asset.TechCode && <span>Technical Code: {asset.TechCode}</span>}
                {asset.Sn && <span>S/N: {asset.Sn}</span>}
              </div>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded transition-colors flex-shrink-0 ml-4"
            >
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6 overflow-auto flex-1">

          {/* Características del Producto - Tabla */}
          {asset.Product?.FeatureValues && asset.Product.FeatureValues.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info size={20} />
                Properties
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Property</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Symbol</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Value</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Unity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...asset.Product.FeatureValues]
                      .sort((a, b) => (a.VisuOrder || 0) - (b.VisuOrder || 0))
                      .map((feature, idx) => (
                        <tr 
                          key={idx}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-sm text-white">{feature.Name}</td>
                          <td className="py-2.5 px-3 text-sm text-gray-400 font-mono">
                            {feature.Symbol || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-sm text-blue-400 font-medium">
                            {feature.ValueType === 'number'
                              ? feature.NumberValue !== 0
                                ? new Intl.NumberFormat('es-ES', {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: feature.NumberValue % 1 === 0 ? 0 : 2
                                  }).format(feature.NumberValue)
                                : 'N/A'
                              : feature.StringValue || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-sm text-gray-400">
                            {feature.Unit || '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Documentos del Producto */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} />
              Product Documents
            </h3>
            {asset.Product?.Documents && asset.Product.Documents.length > 0 ? (
              <div className="space-y-2">
                {asset.Product.Documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium group-hover:text-blue-400 transition-colors truncate">
                          {doc.Nombre}
                        </div>
                        {doc.Descripcion && (
                          <div className="text-sm text-gray-400 mt-1 line-clamp-2">{doc.Descripcion}</div>
                        )}
                      </div>
                      <ExternalLink size={20} className="text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                No documents for this product
              </div>
            )}
          </section>

          {/* Documentos del Activo */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} />
              Asset Documents
            </h3>
            {asset.Documents && asset.Documents.length > 0 ? (
              <div className="space-y-2">
                {asset.Documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium group-hover:text-blue-400 transition-colors truncate">
                          {doc.Nombre}
                        </div>
                        {doc.Descripcion && (
                          <div className="text-sm text-gray-400 mt-1 line-clamp-2">{doc.Descripcion}</div>
                        )}
                      </div>
                      <ExternalLink size={20} className="text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                No documents for this asset
              </div>
            )}
          </section>
        </div>
      </Card>
    </div>
  )
}

