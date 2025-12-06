import { memo } from 'react'
import { Factory, ChevronRight, Package } from 'lucide-react'
import { Card } from '../../../../components/ui/Card'
import { Badge } from '../../../../components/ui/Badge'

/**
 * Componente optimizado para mostrar tarjeta de línea de producción
 * Incluye información de la línea, orden activa y receta
 */
const LineCard = memo(({ line, onClick }) => {
  const progress = line.activeOrder && line.activeOrder.QuantityToProduce > 0
    ? Math.round((line.activeOrder.QuantityProduced / line.activeOrder.QuantityToProduce) * 100)
    : 0

  return (
    <Card
      className="cursor-pointer hover:border-blue-500 transition-all"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-3">
            <Factory className="w-8 h-8 text-blue-400" />
            <div>
              <h3 className="text-2xl font-bold text-white">{line.line}</h3>
              <p className="text-sm text-gray-400">{line.factory}</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Métricas de la línea */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Métricas de Línea</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Estado:</span>
                <Badge variant={line.activeOrder ? 'success' : 'secondary'} className="text-xs">
                  {line.activeOrder ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Órdenes:</span>
                <span className="text-sm text-white font-medium">{line.ordersCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Orden Activa */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Orden Activa</h4>
            {line.activeOrder ? (
              <div className="space-y-2">
                <p className="text-sm font-mono text-blue-400">{line.activeOrder.OrderNumber}</p>
                <p className="text-xs text-gray-300 truncate">{line.activeOrder.ProductName}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Progreso</span>
                    <span className="text-white font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin orden activa</p>
            )}
          </div>

          {/* Receta */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Receta</h4>
            {line.recipe && line.recipe.Components ? (
              <div className="space-y-2">
                <p className="text-sm font-mono text-purple-400">{line.recipe.SapCode}</p>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-300">{line.recipe.Components.length} componentes</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin receta cargada</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Comparación optimizada sin JSON.stringify
  const prevOrder = prevProps.line.activeOrder
  const nextOrder = nextProps.line.activeOrder
  const prevRecipe = prevProps.line.recipe
  const nextRecipe = nextProps.line.recipe

  return (
    prevProps.line.id === nextProps.line.id &&
    prevOrder?.OrderNumber === nextOrder?.OrderNumber &&
    prevOrder?.QuantityProduced === nextOrder?.QuantityProduced &&
    prevRecipe?.Components?.length === nextRecipe?.Components?.length
  )
})

LineCard.displayName = 'LineCard'

export default LineCard
