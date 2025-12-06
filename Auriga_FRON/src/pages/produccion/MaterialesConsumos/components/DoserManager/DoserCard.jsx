import { memo } from 'react'
import { BoxSelect, Plus, Trash2 } from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge'

/**
 * Comparación eficiente de hoppers asignados
 */
const areHoppersEqual = (prev, next) => {
  if (prev.length !== next.length) return false
  return prev.every((p, i) =>
    p.Hopper === next[i].Hopper &&
    p.ComponentSapCode === next[i].ComponentSapCode
  )
}

/**
 * Componente optimizado para mostrar dosificador y sus hoppers asignados
 */
const DoserCard = memo(({
  doser,
  assignedHoppers,
  onAddHopper,
  onDeleteAssignment
}) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BoxSelect className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">{doser.name}</h3>
        </div>
        {assignedHoppers.length > 0 && (
          <Badge variant="success" className="text-xs">
            {assignedHoppers.length} asignados
          </Badge>
        )}
      </div>

      {doser.location && (
        <p className="text-xs text-gray-500 mb-3">📍 {doser.location}</p>
      )}

      {/* Mostrar hoppers asignados */}
      {assignedHoppers.length > 0 && (
        <div className="space-y-2 mb-3">
          {assignedHoppers.map((assigned, idx) => (
            <div
              key={idx}
              className="bg-gray-900/50 rounded p-3 border border-green-700"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-xs text-gray-400">Hopper:</p>
                  <p className="text-sm text-white font-medium">{assigned.Hopper}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteAssignment(doser.name, assigned.Hopper, assigned.ComponentSapCode)
                  }}
                  className="p-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors flex-shrink-0"
                  title="Eliminar asignación"
                  aria-label={`Eliminar asignación de ${assigned.ComponentSapCode}`}
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="mt-2 p-2 bg-green-900/20 border border-green-700 rounded">
                <p className="text-xs text-green-400 font-semibold">Componente:</p>
                <p className="text-xs font-mono text-white">{assigned.ComponentSapCode}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar nuevo hopper + componente */}
      <button
        onClick={onAddHopper}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all"
        aria-label={`Agregar hopper a ${doser.name}`}
      >
        <Plus className="w-5 h-5 text-white" />
        <span className="text-white font-semibold">Agregar Hopper + Componente</span>
      </button>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.doser.id === nextProps.doser.id &&
    areHoppersEqual(prevProps.assignedHoppers, nextProps.assignedHoppers)
  )
})

DoserCard.displayName = 'DoserCard'

export default DoserCard
