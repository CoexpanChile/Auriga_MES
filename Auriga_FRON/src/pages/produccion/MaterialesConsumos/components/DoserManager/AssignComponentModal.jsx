import { useState } from 'react'
import { X, ChevronRight, BoxSelect, CheckCircle2, AlertCircle, Package } from 'lucide-react'
import { Card } from '../../../../components/ui/Card'
import { Badge } from '../../../../components/ui/Badge'

/**
 * Modal para asignar componentes de receta a hoppers de dosificadores
 * Workflow: Seleccionar Hopper → Seleccionar Componente → Asignar
 */
export function AssignComponentModal({
  selectedLine,
  selectedDoser,
  selectedHopper: initialHopper,
  doserConsumptions,
  assigningComponent,
  onClose,
  onAssignComponent
}) {
  const [selectedHopper, setSelectedHopper] = useState(initialHopper)
  const [tempHopper, setTempHopper] = useState(null)

  const currentHopper = selectedHopper || tempHopper

  const handleClose = () => {
    setSelectedHopper(null)
    setTempHopper(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              {!currentHopper ? 'Seleccionar Hopper' : 'Asignar Componente de Receta'}
            </h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Información del Dosificador y Hopper */}
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
              {!currentHopper ? 'Dosificador:' : 'Asignando a:'}
            </h4>
            <div className="space-y-1">
              <p className="text-sm text-white">
                <span className="text-gray-400">Dosificador:</span>{' '}
                <span className="font-semibold">{selectedDoser.name}</span>
              </p>
              {currentHopper && (
                <>
                  <p className="text-sm text-white">
                    <span className="text-gray-400">Hopper:</span>{' '}
                    <span className="font-semibold">{currentHopper.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    📍 {currentHopper.location || 'Sin ubicación'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* PASO 1: Seleccionar Hopper */}
          {!currentHopper && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">
                Seleccionar Hopper Disponible:
              </h4>
              {selectedDoser.components && selectedDoser.components.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedDoser.components.map((hopper) => {
                    const isAlreadyAssigned = (doserConsumptions || []).find(
                      (c) => c.DosingUnit === selectedDoser.name && c.Hopper === hopper.name
                    )

                    return (
                      <button
                        key={hopper.id}
                        onClick={() => setTempHopper(hopper)}
                        disabled={isAlreadyAssigned}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          isAlreadyAssigned
                            ? 'bg-gray-900/50 border-gray-700 cursor-not-allowed opacity-50'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-purple-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-lg font-semibold text-white mb-1">{hopper.name}</p>
                            {hopper.location && (
                              <p className="text-xs text-gray-400">📍 {hopper.location}</p>
                            )}
                            {isAlreadyAssigned && (
                              <div className="mt-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <p className="text-xs text-green-400">
                                  Ya tiene componente asignado: {isAlreadyAssigned.ComponentSapCode}
                                </p>
                              </div>
                            )}
                          </div>
                          {!isAlreadyAssigned && (
                            <ChevronRight className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BoxSelect className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hay hoppers disponibles para este dosificador</p>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: Seleccionar Componente de la Receta */}
          {currentHopper && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-300">
                  Seleccionar Componente de la Receta:
                </h4>
                {!selectedHopper && tempHopper && (
                  <button
                    onClick={() => setTempHopper(null)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    Cambiar hopper
                  </button>
                )}
              </div>
              {selectedLine.recipe && selectedLine.recipe.Components && selectedLine.recipe.Components.length > 0 ? (
                (() => {
                  const filteredComponents = selectedLine.recipe.Components.filter((component) => {
                    const sapCode = component.SapCode?.trim().toUpperCase() || ''
                    return sapCode.startsWith('RE') || sapCode.startsWith('RM')
                  })

                  if (filteredComponents.length === 0) {
                    return (
                      <div className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                        <p className="text-gray-400">No hay componentes disponibles para asignar</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Solo se pueden asignar componentes tipo RE y RM
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredComponents.map((component, idx) => {
                        const isAssignedToThisHopper = (doserConsumptions || []).find(
                          (c) =>
                            c.DosingUnit === selectedDoser.name &&
                            c.Hopper === currentHopper.name &&
                            c.ComponentSapCode === component.SapCode.trim()
                        )

                        return (
                          <button
                            key={idx}
                            onClick={() => onAssignComponent(component.SapCode.trim())}
                            disabled={assigningComponent || isAssignedToThisHopper}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${
                              isAssignedToThisHopper
                                ? 'bg-green-900/30 border-green-700 cursor-not-allowed'
                                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-green-500'
                            } ${assigningComponent ? 'cursor-not-allowed opacity-50' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 mr-4">
                                <p
                                  className={`text-sm font-mono font-semibold ${
                                    isAssignedToThisHopper ? 'text-green-400' : 'text-blue-400'
                                  }`}
                                >
                                  {component.SapCode.trim()}
                                </p>
                                <p className="text-sm text-gray-300 line-clamp-2">
                                  {component.Description}
                                </p>
                                {isAssignedToThisHopper && (
                                  <div className="mt-2">
                                    <Badge variant="success" className="text-xs">
                                      ✓ Asignado
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              <CheckCircle2
                                className={`w-5 h-5 flex-shrink-0 ${
                                  isAssignedToThisHopper ? 'text-green-500' : 'text-gray-600'
                                }`}
                              />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                })()
              ) : (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hay receta cargada para esta línea</p>
                  <p className="text-xs text-gray-500 mt-2">Primero carga la receta desde SAP</p>
                </div>
              )}
            </div>
          )}

          {/* Footer con info */}
          <div className="mt-6 space-y-3">
            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p className="text-xs text-blue-300 mb-2">
                💡 <strong>Nota:</strong> Los componentes asignados quedan guardados automáticamente.
                Puedes asignar múltiples componentes y cerrar cuando termines.
              </p>
              <p className="text-xs text-purple-300">
                🔍 <strong>Filtro:</strong> Solo se muestran componentes tipo{' '}
                <span className="font-mono font-semibold">RE</span> y{' '}
                <span className="font-mono font-semibold">RM</span>.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-white font-semibold">Cerrar y Continuar</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
