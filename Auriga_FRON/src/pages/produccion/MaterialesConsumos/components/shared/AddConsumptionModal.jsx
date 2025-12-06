import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { Card } from '../../../../components/ui/Card'

/**
 * Modal para agregar consumo manual a una orden de fabricación
 */
export function AddConsumptionModal({
  selectedOrder,
  onClose,
  onSubmit,
  isSubmitting
}) {
  const [formData, setFormData] = useState({
    DosingUnit: '',
    DosingHopper: '',
    ComponentSapCode: ''
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    // Validación básica
    if (!formData.DosingUnit.trim() || !formData.DosingHopper.trim() || !formData.ComponentSapCode.trim()) {
      return
    }
    onSubmit(formData)
  }

  const handleClose = () => {
    setFormData({
      DosingUnit: '',
      DosingHopper: '',
      ComponentSapCode: ''
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Agregar Consumo Manual</h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unidad de Dosificación *
              </label>
              <input
                type="text"
                value={formData.DosingUnit}
                onChange={(e) => handleChange('DosingUnit', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Ej: Doser_01"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tolva *
              </label>
              <input
                type="text"
                value={formData.DosingHopper}
                onChange={(e) => handleChange('DosingHopper', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Ej: C1, C2, C3..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código SAP Componente *
              </label>
              <input
                type="text"
                value={formData.ComponentSapCode}
                onChange={(e) => handleChange('ComponentSapCode', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="Ej: COMP001"
                disabled={isSubmitting}
              />
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-400 mb-4">
                * La receta será automáticamente la orden seleccionada:{' '}
                <span className="font-mono text-white">{selectedOrder?.OrderNumber}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.DosingUnit.trim() || !formData.DosingHopper.trim() || !formData.ComponentSapCode.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-white">Agregando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span className="text-white">Agregar</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
