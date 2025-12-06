import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BoxSelect, Factory, Package, RefreshCw, Loader2, ChevronRight, Home, Plus, Trash2, Edit2, Calculator, AlertCircle, CheckCircle2, X, Play, Square, PlayCircle, StopCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { api } from '../../lib/api'
import { useLanguage } from '../../context/LanguageContext'

// Importar hooks y componentes refactorizados
import { useNotifications } from './MaterialesConsumos/hooks'
import { Notifications } from './MaterialesConsumos/components/shared/Notifications'
import { LoadingState, EmptyState } from './MaterialesConsumos/components/shared/LoadingState'
import { PageHeader } from './MaterialesConsumos/components/shared/PageHeader'
import { AddConsumptionModal } from './MaterialesConsumos/components/shared/AddConsumptionModal'
import LineCard from './MaterialesConsumos/components/LineSelector/LineCard'
import DoserCard from './MaterialesConsumos/components/DoserManager/DoserCard'
import { AssignComponentModal } from './MaterialesConsumos/components/DoserManager/AssignComponentModal'

// Helper para debugging solo en desarrollo
const isDev = import.meta.env.DEV
const debug = {
  log: isDev ? console.log.bind(console) : () => {},
  error: isDev ? console.error.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {}
}

// ============================================================================
// COMPONENTES MEMOIZADOS PARA OPTIMIZACIÓN
// ============================================================================
// LineCard y DoserCard ahora se importan desde archivos separados (optimizados)

// Componente para botón de componente de receta (optimizado con memo)
const RecipeComponentButton = memo(({ 
  component, 
  isAssigned, 
  isAssigning,
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isAssigning || isAssigned}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        isAssigned 
          ? 'bg-green-900/30 border-green-700 cursor-not-allowed' 
          : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-green-500'
      } ${isAssigning ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-mono font-semibold ${isAssigned ? 'text-green-400' : 'text-blue-400'}`}>
              {component.SapCode.trim()}
            </p>
            <Badge variant="secondary" className="text-xs">
              {component.MeasurementUnitRQ?.trim() || 'N/A'}
            </Badge>
            {isAssigned && (
              <Badge variant="success" className="text-xs">
                ✓ Asignado
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-300 line-clamp-2">{component.Description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-gray-400">
              Requerido: <span className="text-white font-medium">{component.RequiredQuantity?.trim() || '0'}</span>
            </span>
            <span className="text-gray-400">
              Consumido: <span className="text-green-400 font-medium">{component.WithDrawnQuantity?.trim() || '0'}</span>
            </span>
          </div>
        </div>
        {isAssigning ? (
          <Loader2 className="w-5 h-5 text-green-500 animate-spin flex-shrink-0" />
        ) : isAssigned ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : (
          <Plus className="w-5 h-5 text-green-500 flex-shrink-0" />
        )}
      </div>
    </button>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.component.SapCode === nextProps.component.SapCode &&
    prevProps.isAssigned === nextProps.isAssigned &&
    prevProps.isAssigning === nextProps.isAssigning
  )
})

RecipeComponentButton.displayName = 'RecipeComponentButton'

function MaterialsConsumablesPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  // Hook de notificaciones refactorizado
  const { error, success, showError, showSuccess, clearError, clearSuccess } = useNotifications()

  const selectedFactory = useMemo(() => {
    const saved = localStorage.getItem('selectedFactory')
    return saved && saved !== 'CX' ? saved : null
  }, [])

  const isGlobalView = !selectedFactory


  const [lines, setLines] = useState([])
  const [linesWithData, setLinesWithData] = useState([]) // Líneas con órdenes y recetas
  const [selectedLine, setSelectedLine] = useState(null)
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [consumptions, setConsumptions] = useState([])
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingConsumptions, setLoadingConsumptions] = useState(false)
  const [loadingRecipe, setLoadingRecipe] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newConsumption, setNewConsumption] = useState({
    DosingUnit: '',
    DosingHopper: '',
    ComponentSapCode: ''
  })
  const [addingConsumption, setAddingConsumption] = useState(false)
  const [editingDates, setEditingDates] = useState(null)
  const [dateEdit, setDateEdit] = useState({ start: '', end: '' })
  const [updatingSAP, setUpdatingSAP] = useState(false)
  const [updatingOrder, setUpdatingOrder] = useState(null)
  const [loadingLineData, setLoadingLineData] = useState(false)
  const [dosers, setDosers] = useState([])
  const [loadingDosers, setLoadingDosers] = useState(false)
  const [expandedDoser, setExpandedDoser] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedDoser, setSelectedDoser] = useState(null)
  const [selectedHopper, setSelectedHopper] = useState(null)
  const [tempHopper, setTempHopper] = useState(null) // Hopper temporal seleccionado en el modal
  const [assigningComponent, setAssigningComponent] = useState(false)
  const [doserConsumptions, setDoserConsumptions] = useState([]) // Consumos actuales de todos los hoppers
  const [loadingConsumptionsForDosers, setLoadingConsumptionsForDosers] = useState(false)

  useEffect(() => {
    loadLines()
  }, [selectedFactory])

  useEffect(() => {
    if (lines.length > 0) {
      loadLinesWithData()
    }
  }, [lines])

  useEffect(() => {
    if (selectedLine) {
      loadOrders()
      loadDosers()
      if (selectedLine.activeOrder) {
        loadDoserConsumptions()
      }
    }
  }, [selectedLine])

  useEffect(() => {
    if (selectedOrder && selectedLine) {
      loadRecipe()
      loadConsumptions()
    }
  }, [selectedOrder, selectedLine])

  const loadLines = async () => {
    try {
      setLoading(true)
      debug.log('🔄 Cargando líneas - Vista Tabla Completa')
      debug.log('📍 Factory seleccionada:', selectedFactory, 'isGlobalView:', isGlobalView)
      
      // Usar /asset/list y filtrar en el cliente (evita CORS y 404)
      const assets = await api.get('/asset/list')
      
      // Filtrar solo líneas de producción
      let linesData = (assets || []).filter(asset => 
        asset.hierarchical_level && 
        asset.hierarchical_level.length >= 2 &&
        asset.hierarchical_level[1]?.startsWith('L')
      )
      
      // Filtrar por fábrica si se especifica
      if (selectedFactory) {
        linesData = linesData.filter(line => 
          line.location?.includes(selectedFactory) || 
          line.hierarchical_level?.[0] === selectedFactory ||
          line.factory === selectedFactory
        )
      }
      
      debug.log('📦 Líneas filtradas:', linesData.length)
      debug.log('✅ Líneas cargadas:', linesData.length, 'líneas')
      debug.log('📊 Datos de líneas:', linesData)
      setLines(linesData)
      clearError()
    } catch (err) {
      debug.error('❌ Error loading lines:', err)
      showError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const loadLinesWithData = async () => {
    try {
      setLoadingLineData(true)
      // Limitar a las primeras 10 líneas para mejorar rendimiento inicial
      const linesToLoad = lines.slice(0, 10)
      debug.log('🔄 Cargando datos completos para', linesToLoad.length, 'líneas (de', lines.length, 'totales)')
      
      const linesData = await Promise.all(
        linesToLoad.map(async (line) => {
          try {
            // Cargar órdenes para esta línea
            const sapCode = line.sap_code || line.code || line.line || ''
            const ordersResponse = await api.post('/sap/orders', {}, {
              headers: {
                'Content-Type': 'application/json',
                'Factory': line.factory,
                'ProdLine': line.line,
                'SapCode': sapCode,
                'SapRequest': 'false'
              },
              
            })
            
            const ordersData = Array.isArray(ordersResponse) ? ordersResponse : []
            
            // Buscar orden activa (Started pero no Finished)
            const activeOrder = ordersData.find(order => 
              order.StarteddAt && !order.FinishedAt
            ) || ordersData[0] // Si no hay activa, tomar la primera
            
            let recipeData = null
            if (activeOrder) {
              try {
                debug.log(`🔄 Cargando receta para línea ${line.line}, orden ${activeOrder.OrderNumber}`)
                // Cargar receta para la orden activa desde SAP
                const recipeResponse = await api.get('/sap/orderRecipe', {
                  headers: {
                    'Factory': line.factory,
                    'ProdLine': line.line,
                    'SapOrderCode': activeOrder.OrderNumber,
                    'SapRequest': 'true' // Cargar desde SAP
                  }
                })
                recipeData = recipeResponse
                debug.log(`✅ Receta cargada para ${line.line}:`, recipeData ? `${recipeData.Components?.length || 0} componentes` : 'sin datos')
              } catch (recipeErr) {
                debug.error(`❌ Error cargando receta para ${line.line}:`, recipeErr.response?.data || recipeErr.message)
              }
            } else {
              debug.log(`⚠️ Línea ${line.line} no tiene orden activa`)
            }
            
            return {
              ...line,
              orders: ordersData,
              activeOrder: activeOrder,
              recipe: recipeData
            }
          } catch (err) {
            debug.error(`Error cargando datos para línea ${line.line}:`, err)
            return {
              ...line,
              orders: [],
              activeOrder: null,
              recipe: null
            }
          }
        })
      )
      
      debug.log('✅ Datos completos cargados:', linesData)
      setLinesWithData(linesData)
    } catch (err) {
      debug.error('Error loading lines with data:', err)
    } finally {
      setLoadingLineData(false)
    }
  }

  const loadOrders = async (fromSAP = false) => {
    if (!selectedLine) return
    
    try {
      setLoadingOrders(true)
      setUpdatingSAP(fromSAP)
      
      const sapCode = selectedLine.sap_code || selectedLine.code || selectedLine.line || ''
      const headers = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'SapCode': sapCode,
        'SapRequest': fromSAP ? 'true' : 'false'
      }
      
      const response = await api.post('/sap/orders', {}, {
        headers: headers,
        
      })
      
      const ordersData = Array.isArray(data) ? data : []
      debug.log('Orders loaded:', ordersData.length, ordersData)
      setOrders(ordersData)
      clearError()
      if (fromSAP) {
        showSuccess('Órdenes actualizadas desde SAP exitosamente')
      }
    } catch (err) {
      debug.error('Error loading orders:', err)
      showError('Error al cargar las órdenes de producción')
    } finally {
      setLoadingOrders(false)
      setUpdatingSAP(false)
    }
  }

  const loadDosers = async () => {
    debug.error('========================================')
    debug.error('🚀 INICIANDO loadDosers()')
    debug.error('========================================')
    
    if (!selectedLine) {
      debug.error('⚠️ No selectedLine, retornando')
      return
    }
    
    try {
      setLoadingDosers(true)
      
      // Debug: verificar estructura completa de selectedLine
      debug.error('🔍 DEBUG loadDosers - selectedLine completo:')
      debug.error(JSON.stringify(selectedLine, null, 2))
      debug.error('🔍 selectedLine.id:', selectedLine.id)
      debug.error('🔍 selectedLine.ID:', selectedLine.ID)
      debug.error('🔍 typeof selectedLine.id:', typeof selectedLine.id)
      
      // Intentar con id minúscula o mayúscula
      const lineId = selectedLine.id || selectedLine.ID
      
      if (!lineId) {
        debug.error('❌ No se encontró ID de línea en selectedLine:', selectedLine)
        debug.error('❌ Keys disponibles:', Object.keys(selectedLine))
        setDosers([])
        return
      }
      
      debug.error('🔄 Cargando dosificadores para línea:', selectedLine.line, 'ID:', lineId, 'tipo:', typeof lineId)
      debug.error('🔄 Headers que se enviarán:')
      debug.error({
        'Content-Type': 'application/json',
        'ProdLine_ID': String(lineId)
      })
      debug.error('🔄 También enviando como query param: line_id=' + lineId)
      
      // Intentar con header Y query param
      const response = await api.get('/asset/dosingbyline', {
        params: {
          line_id: lineId
        },
        headers: {
          'Content-Type': 'application/json',
          'ProdLine_ID': String(lineId)
        },
        
      })
      
      const dosersData = Array.isArray(data) ? data : []
      debug.error('✅ Dosificadores cargados:', dosersData.length, dosersData)
      setDosers(dosersData)
    } catch (err) {
      debug.error('❌ Error loading dosers:', err)
      debug.error('❌ Error response:', err.response?.data)
      debug.error('❌ Error status:', err.response?.status)
      debug.error('❌ Error config:', err.config)
      // No mostrar error al usuario, solo log
      setDosers([])
    } finally {
      setLoadingDosers(false)
    }
  }

  const loadDoserConsumptions = async () => {
    if (!selectedLine || !selectedLine.activeOrder) return
    
    try {
      setLoadingConsumptionsForDosers(true)
      debug.error('🔄 Cargando consumos para dosificadores')
      
      const response = await api.get('/sap/orderConsump/list', {
        headers: {
          'Content-Type': 'application/json',
          'Factory': selectedLine.factory,
          'ProdLine': selectedLine.line,
          'System': 'Dosing',
          'SapOrderCode': selectedLine.activeOrder.OrderNumber.trim(),
          'SapRequest': 'false'
        },
        
      })
      
      const consumptionsData = Array.isArray(data) ? data : []
      debug.error('✅ Consumos cargados para dosificadores:', consumptionsData.length, consumptionsData)
      setDoserConsumptions(consumptionsData)
    } catch (err) {
      debug.error('❌ Error loading doser consumptions:', err)
      setDoserConsumptions([])
    } finally {
      setLoadingConsumptionsForDosers(false)
    }
  }

  const handleDeleteAssignment = useCallback(async (doserName, hopperName, componentSapCode) => {
    if (!selectedLine || !selectedLine.activeOrder) return
    
    if (!window.confirm(`¿Eliminar la asignación del componente ${componentSapCode} del hopper ${hopperName}?`)) {
      return
    }
    
    try {
      debug.error('🗑️ Eliminando asignación:', componentSapCode, 'de', doserName, hopperName)
      
      const response = await api.get('/sap/orderConsump/del', {
        headers: {
          'Content-Type': 'application/json',
          'Factory': selectedLine.factory,
          'ProdLine': selectedLine.line,
          'System': 'Dosing',
          'Machine': doserName,
          'Part': hopperName,
          'SapOrderCode': selectedLine.activeOrder.OrderNumber.trim(),
          'SapComponentCode': componentSapCode
        },
        
      })
      
      debug.error('✅ Asignación eliminada:', data)
      showSuccess(`✅ Componente ${componentSapCode} desasignado de ${hopperName}`)
      
      // Recargar consumos
      await loadDoserConsumptions()
      await loadLinesWithData()
    } catch (err) {
      debug.error('❌ Error eliminando asignación:', err)
      showError('Error al eliminar la asignación del componente')
    }
  }, [selectedLine, loadDoserConsumptions, loadLinesWithData])

  const handleAssignComponent = useCallback(async (componentSapCode) => {
    const currentHopper = selectedHopper || tempHopper
    if (!selectedLine || !selectedDoser || !currentHopper || !selectedLine.activeOrder) return
    
    try {
      setAssigningComponent(true)
      clearError()
      debug.error('🔄 Asignando componente:', componentSapCode, 'a doser:', selectedDoser.name, 'hopper:', currentHopper.name)
      
      const response = await api.get('/sap/orderConsump/add', {
        headers: {
          'Content-Type': 'application/json',
          'Factory': selectedLine.factory,
          'ProdLine': selectedLine.line,
          'System': 'Dosing', // Sistema de dosificación
          'Machine': selectedDoser.name, // Nombre del doser
          'Part': currentHopper.name, // Nombre del hopper
          'SapOrderCode': selectedLine.activeOrder.OrderNumber.trim(),
          'SapComponentCode': componentSapCode
        },
        
      })
      
      debug.error('✅ Componente asignado exitosamente:', data)
      showSuccess(`✅ Componente ${componentSapCode} asignado a ${selectedDoser.name} / ${currentHopper.name}`)
      
      // NO cerrar modal - mantener abierto para múltiples asignaciones
      // El usuario debe cerrar manualmente cuando termine
      
      // Recargar consumos y líneas con datos actualizados
      await loadDoserConsumptions()
      await loadLinesWithData()
    } catch (err) {
      debug.error('❌ Error asignando componente:', err)
      debug.error('❌ Error response:', err.response?.data)
      
      // Manejo de errores específicos
      if (err.response?.status === 500) {
        const errorMsg = err.response?.data?.Message || err.response?.data?.message || ''
        if (errorMsg.includes('duplicate') || errorMsg.includes('unique constraint')) {
          showError(`⚠️ Este hopper (${currentHopper.name}) ya tiene un componente asignado. Primero debes eliminar la asignación actual.`)
        } else {
          showError('❌ Error del servidor al asignar el componente. Revisa los logs del backend.')
        }
      } else {
        showError('❌ Error al asignar el componente al dosificador')
      }
    } finally {
      setAssigningComponent(false)
    }
  }, [selectedLine, selectedDoser, selectedHopper, tempHopper, loadDoserConsumptions, loadLinesWithData])

  const handleStartFinish = async (orderNumber, action) => {
    if (!selectedLine) return
    
    try {
      setUpdatingOrder(orderNumber)
      clearError()
      
      const sapCode = selectedLine.sap_code || selectedLine.code || selectedLine.line || ''
      const headers = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'SapCode': sapCode,
        'SapRequest': 'false',
        'OrderNumber': orderNumber,
        'StartFinish': action // 'Start' o 'Finish'
      }
      
      const response = await api.get('/sap/orders/startFinish', {
        headers: headers,
        
      })
      
      // Recargar órdenes después de actualizar
      await loadOrders(false)
      showSuccess(`Orden ${action === 'Start' ? 'iniciada' : 'finalizada'} exitosamente`)
    } catch (err) {
      debug.error(`Error ${action} order:`, err)
      showError(`Error al ${action === 'Start' ? 'iniciar' : 'finalizar'} la orden`)
    } finally {
      setUpdatingOrder(null)
    }
  }

  const handleEditDates = (order) => {
    setEditingDates(order.OrderNumber)
    // Formatear fechas para input datetime-local
    const startDate = order.StarteddAt ? new Date(order.StarteddAt).toISOString().slice(0, 16) : ''
    const endDate = order.FinishedAt ? new Date(order.FinishedAt).toISOString().slice(0, 16) : ''
    setDateEdit({ start: startDate, end: endDate })
  }

  const handleSaveDates = async (orderNumber) => {
    if (!selectedLine) return
    
    try {
      setUpdatingOrder(orderNumber)
      clearError()
      
      if (!dateEdit.start || !dateEdit.end) {
        showError('Por favor, completa ambas fechas')
        return
      }
      
      const sapCode = selectedLine.sap_code || selectedLine.code || selectedLine.line || ''
      const headers = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'SapCode': sapCode,
        'SapRequest': 'false',
        'OrderNumber': orderNumber,
        'StarteddAt': new Date(dateEdit.start).toISOString(),
        'FinishedAt': new Date(dateEdit.end).toISOString()
      }
      
      await api.get('/sap/orders/update', {
        headers: headers,
        
      })
      
      // Recargar órdenes después de actualizar
      await loadOrders(false)
      setEditingDates(null)
      setDateEdit({ start: '', end: '' })
      showSuccess('✅ Fechas actualizadas exitosamente')
    } catch (err) {
      debug.error('Error updating dates:', err)
      showError('Error al actualizar las fechas')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const handleCancelEditDates = () => {
    setEditingDates(null)
    setDateEdit({ start: '', end: '' })
  }

  const loadRecipe = async (fromSAP = false) => {
    if (!selectedOrder || !selectedLine) return
    
    try {
      setLoadingRecipe(true)
      
      const headers = {
        'Content-Type': 'application/json',
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapRequest': fromSAP ? 'true' : 'false',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line
      }
      
      const response = await api.get('/sap/orderRecipe', {
        headers: headers,
        
      })
      
      setRecipe(data || null)
      if (fromSAP && data) {
        showSuccess('Receta cargada exitosamente desde SAP')
      }
    } catch (err) {
      debug.error('Error loading recipe:', err)
      const errorMessage = err.response?.data?.message || 'Error al cargar la receta'
      showError(errorMessage)
      setRecipe(null)
    } finally {
      setLoadingRecipe(false)
    }
  }

  const loadConsumptions = async () => {
    if (!selectedOrder || !selectedLine) return
    
    try {
      setLoadingConsumptions(true)
      clearError()
      
      const headers = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'System': '', // Puede estar vacío según el handler
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapRequest': 'false'
      }
      
      const response = await api.get('/sap/orderConsump/list', {
        headers: headers,
        
      })
      
      const consumptionsData = Array.isArray(data) ? data : []
      // Filtrar entradas vacías si el backend retorna un array con un elemento vacío
      const filteredConsumptions = consumptionsData.filter(c => 
        c.ComponentSapCode && c.ComponentSapCode.trim() !== ''
      )
      
      setConsumptions(filteredConsumptions)
      setLastUpdate(new Date())
    } catch (err) {
      debug.error('Error loading consumptions:', err)
      if (err.response?.status === 403) {
        showError('No tienes permisos para acceder a los consumos')
      } else {
        showError('Error al cargar los consumos de materiales')
      }
    } finally {
      setLoadingConsumptions(false)
    }
  }

  const handleCalculateConsumptions = async () => {
    if (!selectedOrder || !selectedLine) return
    
    try {
      setLoadingConsumptions(true)
      clearError()
      clearSuccess()
      
      const headers = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'SapOrderCode': selectedOrder.OrderNumber
      }
      
      const response = await api.get('/sap/orderConsump/Calculate', {
        headers: headers,
        
      })
      
      const consumptionsData = Array.isArray(data) ? data : []
      const filteredConsumptions = consumptionsData.filter(c => 
        c.ComponentSapCode && c.ComponentSapCode.trim() !== ''
      )
      
      setConsumptions(filteredConsumptions)
      showSuccess('Consumos calculados exitosamente desde InfluxDB')
      setLastUpdate(new Date())
      
      // Ocultar mensaje de éxito después de 5 segundos
    } catch (err) {
      debug.error('Error calculating consumptions:', err)
      // Mostrar el mensaje de error del backend si está disponible
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Error al calcular los consumos desde InfluxDB'
      showError(errorMessage)
    } finally {
      setLoadingConsumptions(false)
    }
  }

  const handleDeleteConsumption = async (consumption) => {
    if (!selectedOrder || !selectedLine) return
    if (!window.confirm('¿Estás seguro de eliminar este consumo?')) return
    
    try {
      clearError()
      
      const headers = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'System': '',
        'Machine': consumption.DosingUnit,
        'Part': consumption.DosingHopper,
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapComponentCode': consumption.ComponentSapCode
      }
      
      await api.get('/sap/orderConsump/del', {
        headers: headers,
        
      })
      
      // Recargar consumos después de eliminar
      await loadConsumptions()
      showSuccess('Consumo eliminado exitosamente')
    } catch (err) {
      debug.error('Error deleting consumption:', err)
      showError('Error al eliminar el consumo')
    }
  }

  const handleAddConsumption = async () => {
    if (!selectedOrder || !selectedLine) return
    
    // Validar campos requeridos
    if (!newConsumption.DosingUnit.trim() || !newConsumption.DosingHopper.trim() || !newConsumption.ComponentSapCode.trim()) {
      showError('Por favor, completa todos los campos requeridos')
      return
    }
    
    try {
      setAddingConsumption(true)
      clearError()
      
      const headers = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'System': '',
        'Machine': newConsumption.DosingUnit.trim(),
        'Part': newConsumption.DosingHopper.trim(),
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapComponentCode': newConsumption.ComponentSapCode.trim()
      }
      
      await api.get('/sap/orderConsump/add', {
        headers: headers,
        
      })
      
      // Cerrar modal y limpiar formulario
      setShowAddModal(false)
      setNewConsumption({
        DosingUnit: '',
        DosingHopper: '',
        ComponentSapCode: ''
      })
      
      // Recargar consumos después de agregar
      await loadConsumptions()
      // Recargar receta también por si acaso
      await loadRecipe()
      showSuccess('Consumo agregado exitosamente')
    } catch (err) {
      debug.error('Error adding consumption:', err)
      const errorMessage = err.response?.data?.message || 'Error al agregar el consumo'
      showError(errorMessage)
    } finally {
      setAddingConsumption(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando líneas de producción..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header refactorizado */}
        <PageHeader
          currentFactory={selectedFactory}
          isGlobalView={isGlobalView}
          lastUpdate={lastUpdate}
        />

        {/* Notificaciones refactorizadas con accesibilidad */}
        <Notifications
          error={error}
          success={success}
          onClearError={clearError}
          onClearSuccess={clearSuccess}
        />

        {/* Line Selection - Vista Cards */}
        {!selectedLine && (
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Seleccionar Línea de Producción
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setUpdatingSAP(true)
                      // Sincronizar todas las líneas con SAP
                      Promise.all(lines.map(line => {
                        const sapCode = line.sap_code || line.code || line.line || ''
                        return api.post('/sap/orders', {}, {
                          headers: {
                            'Content-Type': 'application/json',
                            'Factory': line.factory,
                            'ProdLine': line.line,
                            'SapCode': sapCode,
                            'SapRequest': 'true'
                          },
                          
                        }).catch(err => {
                          debug.error(`Error sincronizando línea ${line.line}:`, err)
                          return null
                        })
                      })).then(() => {
                        showSuccess('Todas las líneas sincronizadas con SAP exitosamente')
                        // Recargar datos de las líneas
                        loadLinesWithData()
                      }).catch(err => {
                        debug.error('Error en sincronización masiva:', err)
                        showError('Error al sincronizar algunas líneas con SAP')
                      }).finally(() => {
                        setUpdatingSAP(false)
                      })
                    }}
                    disabled={updatingSAP}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm"
                  >
                    {updatingSAP ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Sincronizar SAP (Todas)</span>
                  </button>
                  <button
                    onClick={loadLines}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>
              {loadingLineData ? (
                <LoadingState message="Cargando información completa de las líneas..." />
              ) : linesWithData.length === 0 ? (
                <EmptyState
                  icon={Factory}
                  title="No hay líneas disponibles"
                  description={`No se encontraron líneas de producción${selectedFactory ? ` para la fábrica ${selectedFactory}` : ''}`}
                />
              ) : (
                <div className="space-y-4">
                  {linesWithData.map((line) => {
                    const activeOrder = line.activeOrder
                    const recipe = line.recipe
                    const progress = activeOrder && activeOrder.QuantityToProduce > 0
                      ? Math.round((activeOrder.QuantityProduced / activeOrder.QuantityToProduce) * 100)
                      : 0
                    
                    return (
                      <Card 
                        key={line.id}
                        className="cursor-pointer hover:border-blue-500 transition-all"
                        onClick={() => setSelectedLine(line)}
                      >
                        <div className="p-6">
                          {/* Header de la línea */}
                          <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-4">
                            <div className="flex items-center gap-4">
                              <Factory className="w-8 h-8 text-blue-400" />
                              <div>
                                <h3 className="text-2xl font-bold text-white">{line.line}</h3>
                                <p className="text-sm text-gray-400">{line.location || line.factory} • <span className="font-mono">{line.code || line.sap_code || 'N/A'}</span></p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={line.influx_available ? 'success' : 'secondary'}>
                                {line.influx_available ? 'Activa' : 'Sin datos'}
                              </Badge>
                              <Badge 
                                variant={
                                  line.status?.toLowerCase() === 'running' || line.status?.toLowerCase() === 'operando' ? 'success' :
                                  line.status?.toLowerCase() === 'stopped' || line.status?.toLowerCase() === 'detenida' ? 'danger' :
                                  line.status?.toLowerCase() === 'maintenance' || line.status?.toLowerCase() === 'mantenimiento' ? 'warning' :
                                  'secondary'
                                }
                              >
                                {line.status === 'running' ? 'Operando' :
                                 line.status === 'stopped' ? 'Detenida' :
                                 line.status === 'maintenance' ? 'Mantenimiento' :
                                 line.status || 'Desconocido'}
                              </Badge>
                              {line.oee !== undefined && line.oee !== null && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-400">OEE</p>
                                  <p className={`text-lg font-bold ${
                                    line.oee >= 85 ? 'text-green-500' :
                                    line.oee >= 70 ? 'text-yellow-500' :
                                    'text-red-500'
                                  }`}>
                                    {line.oee.toFixed(1)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Grid de 3 columnas: Línea | OF | Receta */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Columna 1: Métricas de Línea */}
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                              <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Métricas de Línea</h4>
                              <div className="space-y-3">
                                {line.speed !== undefined && line.speed !== null && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Velocidad:</span>
                                    <span className="text-lg font-bold text-white font-mono">{line.speed.toFixed(1)} <span className="text-sm text-gray-500">kg/h</span></span>
                                  </div>
                                )}
                                {line.production !== undefined && line.production !== null && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Producción:</span>
                                    <span className="text-lg font-bold text-white font-mono">{line.production.toFixed(0)} <span className="text-sm text-gray-500">m</span></span>
                                  </div>
                                )}
                                {line.last_update && (
                                  <div className="pt-2 border-t border-gray-700">
                                    <p className="text-xs text-gray-500">Última actualización</p>
                                    <p className="text-sm text-gray-300">
                                      {new Date(line.last_update).toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Columna 2: Orden de Fabricación */}
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                              <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Orden de Fabricación</h4>
                              {activeOrder ? (
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs text-gray-500">Número de Orden</p>
                                    <p className="text-lg font-bold text-white font-mono">{activeOrder.OrderNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Producto</p>
                                    <p className="text-sm text-white font-medium line-clamp-2">{activeOrder.ProductName || '-'}</p>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-700">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">A Producir</p>
                                      <p className="text-lg font-bold text-blue-400">{activeOrder.QuantityToProduce || '0'}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Producido</p>
                                      <p className="text-lg font-bold text-green-400">{activeOrder.QuantityProduced || '0'}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Pendiente</p>
                                      <p className="text-lg font-bold text-orange-400">{activeOrder.QuantityRemainedToProduce || '0'}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <p className="text-xs text-gray-400">Progreso</p>
                                      <p className="text-sm font-bold text-white">{progress}%</p>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full min-h-[150px]">
                                  <div className="text-center">
                                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Sin orden activa</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Columna 3: Receta y Componentes */}
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                              <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Receta y Componentes</h4>
                              {recipe && recipe.Components && recipe.Components.length > 0 ? (
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs text-gray-500">Código SAP Receta</p>
                                    <p className="text-sm font-mono text-white">{recipe.SapCode || activeOrder?.OrderNumber || '-'}</p>
                                  </div>
                                  <div className="pt-2 border-t border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs text-gray-500">Componentes</p>
                                      <Badge variant="info" className="text-xs">
                                        {recipe.Components.length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                                      {recipe.Components.slice(0, 5).map((component, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-900/50 rounded p-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-mono text-gray-400 truncate">{component.SapCode || '-'}</p>
                                            <p className="text-xs text-gray-500 truncate">{component.Description || '-'}</p>
                                          </div>
                                          <div className="text-right ml-2">
                                            <p className="text-xs font-medium text-white">{component.RequiredQuantity || '0'}</p>
                                            <p className="text-xs text-gray-500">{component.MeasurementUnitRQ || ''}</p>
                                          </div>
                                        </div>
                                      ))}
                                      {recipe.Components.length > 5 && (
                                        <p className="text-xs text-gray-500 text-center pt-1">
                                          +{recipe.Components.length - 5} más...
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full min-h-[150px]">
                                  <div className="text-center">
                                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Sin receta cargada</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Order Selection */}
        {selectedLine && !selectedOrder && (
          <>
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setSelectedLine(null)
                        setOrders([])
                      }}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedLine.line}</h2>
                      <p className="text-gray-400">{selectedLine.location || selectedLine.factory}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {loadingOrders ? (
              <Card>
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Cargando órdenes de producción...</p>
                </div>
              </Card>
            ) : orders.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No hay órdenes de producción disponibles</p>
                  <p className="text-sm text-gray-500 mt-2">Selecciona una orden primero</p>
                </div>
              </Card>
            ) : (
              <>
                <Card className="mb-6">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-white">
                        Órdenes de Fabricación ({orders.length})
                      </h2>
                      <button
                        onClick={() => loadOrders(true)}
                        disabled={updatingSAP}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm"
                      >
                        {updatingSAP ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span>SAP UPDATE</span>
                      </button>
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">{orders.map((order, index) => {
                  const progress = order.QuantityToProduce > 0
                    ? Math.round((order.QuantityProduced / order.QuantityToProduce) * 100)
                    : 0
                  const isActive = order.StarteddAt && !order.FinishedAt
                  
                  return (
                    <Card 
                      key={index}
                      className="transition-all"
                    >
                      <div className="p-6">
                        {/* Header de la orden */}
                        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-4">
                          <div className="flex items-center gap-4">
                            <Package className="w-8 h-8 text-blue-400" />
                            <div>
                              <h3 className="text-2xl font-bold text-white font-mono">{order.OrderNumber}</h3>
                              <p className="text-sm text-gray-400">{order.ProductName || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={isActive ? 'success' : order.FinishedAt ? 'secondary' : 'warning'}>
                              {isActive ? 'En Producción' : order.FinishedAt ? 'Finalizada' : 'Pendiente'}
                            </Badge>
                            {order.MeasurementUnit && (
                              <Badge variant="info">{order.MeasurementUnit}</Badge>
                            )}
                          </div>
                        </div>

                        {/* Grid de información */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Columna 1: Información del Producto */}
                          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Información del Producto</h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-gray-500">Código Producto</p>
                                <p className="text-lg font-bold text-white font-mono">{order.ProductName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Descripción</p>
                                <p className="text-sm text-gray-300 line-clamp-2" title={order.ProductDescription}>
                                  {order.ProductDescription || '-'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Columna 2: Cantidades y Progreso */}
                          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Progreso de Producción</h4>
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 mb-1">A Producir</p>
                                  <p className="text-2xl font-bold text-blue-400">{order.QuantityToProduce || '0'}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 mb-1">Producido</p>
                                  <p className="text-2xl font-bold text-green-400">{order.QuantityProduced || '0'}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 mb-1">Pendiente</p>
                                  <p className="text-2xl font-bold text-orange-400">{order.QuantityRemainedToProduce || '0'}</p>
                                </div>
                              </div>
                              
                              {/* Barra de Progreso */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-xs text-gray-400">Progreso</p>
                                  <p className="text-sm font-bold text-white">{progress}%</p>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Columna 3: Fechas y Acciones */}
                          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Fechas y Acciones</h4>
                            <div className="space-y-3">
                              {/* Fechas */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Inicio</p>
                                  {editingDates === order.OrderNumber ? (
                                    <input
                                      type="datetime-local"
                                      value={dateEdit.start}
                                      onChange={(e) => setDateEdit({ ...dateEdit, start: e.target.value })}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded border border-gray-600"
                                    />
                                  ) : (
                                    <p className="text-sm text-gray-300">
                                      {order.StarteddAt 
                                        ? new Date(order.StarteddAt).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        : '-'}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Fin</p>
                                  {editingDates === order.OrderNumber ? (
                                    <input
                                      type="datetime-local"
                                      value={dateEdit.end}
                                      onChange={(e) => setDateEdit({ ...dateEdit, end: e.target.value })}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded border border-gray-600"
                                    />
                                  ) : (
                                    <p className="text-sm text-gray-300">
                                      {order.FinishedAt 
                                        ? new Date(order.FinishedAt).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        : '-'}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Botones de Acción */}
                              <div className="pt-3 border-t border-gray-700 space-y-2" onClick={(e) => e.stopPropagation()}>
                                {editingDates === order.OrderNumber ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveDates(order.OrderNumber)}
                                      disabled={updatingOrder === order.OrderNumber}
                                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded text-sm transition-colors"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span className="text-white">Guardar</span>
                                    </button>
                                    <button
                                      onClick={handleCancelEditDates}
                                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                      <span className="text-white">Cancelar</span>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEditDates(order)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    <span className="text-white">Editar Fechas</span>
                                  </button>
                                )}
                                
                                {!order.StarteddAt && (
                                  <button
                                    onClick={() => handleStartFinish(order.OrderNumber, 'Start')}
                                    disabled={updatingOrder === order.OrderNumber}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded text-sm transition-colors"
                                  >
                                    {updatingOrder === order.OrderNumber ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <PlayCircle className="w-4 h-4" />
                                    )}
                                    <span className="text-white">Iniciar</span>
                                  </button>
                                )}
                                
                                {order.StarteddAt && !order.FinishedAt && (
                                  <button
                                    onClick={() => handleStartFinish(order.OrderNumber, 'Finish')}
                                    disabled={updatingOrder === order.OrderNumber}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded text-sm transition-colors"
                                  >
                                    {updatingOrder === order.OrderNumber ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <StopCircle className="w-4 h-4" />
                                    )}
                                    <span className="text-white">Finalizar</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}</div>
              </>
            )}

            {/* Dosers Section */}
            {!selectedOrder && (
              <Card className="mb-6">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <BoxSelect className="w-6 h-6 text-purple-400" />
                      Dosificadores de la Línea
                    </h2>
                    <button
                      onClick={loadDosers}
                      disabled={loadingDosers}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm"
                    >
                      {loadingDosers ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>Actualizar</span>
                    </button>
                  </div>

                  {loadingDosers ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-3" />
                      <p className="text-gray-400">Cargando dosificadores...</p>
                    </div>
                  ) : dosers.length === 0 ? (
                    <div className="p-8 text-center">
                      <BoxSelect className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No hay dosificadores configurados para esta línea</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dosers.map((doser) => {
                        const assignedHoppers = doserConsumptions.filter(c => c.DosingUnit === doser.name)
                        
                        return (
                          <DoserCard
                            key={doser.id}
                            doser={doser}
                            assignedHoppers={assignedHoppers}
                            onAddHopper={() => {
                              setSelectedDoser(doser)
                              setSelectedHopper(null)
                              setShowAssignModal(true)
                            }}
                            onDeleteAssignment={handleDeleteAssignment}
                          />
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Botón Guardar Todo y Continuar a Consumos */}
                  {!loadingDosers && dosers.length > 0 && selectedLine.activeOrder && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <button
                        onClick={() => {
                          // Seleccionar automáticamente la orden activa para ir a la vista de consumos
                          setSelectedOrder(selectedLine.activeOrder)
                          showSuccess('✅ Configuración guardada. Cargando vista de consumos...')
                        }}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg transition-all shadow-lg"
                      >
                        <CheckCircle2 className="w-6 h-6 text-white" />
                        <span className="text-white font-bold text-lg">Guardar Todo y Continuar a Consumos</span>
                        <ChevronRight className="w-6 h-6 text-white" />
                      </button>
                      <p className="text-xs text-center text-gray-400 mt-2">
                        Los cambios ya están guardados. Este botón te llevará a la vista de cálculo de consumos.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Recipe and Consumptions Display */}
        {selectedLine && selectedOrder && (
          <>
            {/* Header */}
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setSelectedOrder(null)
                        setConsumptions([])
                        setRecipe(null)
                      }}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedOrder.OrderNumber}</h2>
                      <p className="text-gray-400">{selectedOrder.ProductDescription || selectedOrder.ProductName}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Línea: {selectedLine.line} | Fábrica: {selectedLine.factory}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-white">Agregar Consumo</span>
                    </button>
                    <button
                      onClick={() => loadRecipe(true)}
                      disabled={loadingRecipe}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {loadingRecipe ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span className="text-white">Cargar Receta desde SAP</span>
                    </button>
                    <button
                      onClick={handleCalculateConsumptions}
                      disabled={loadingConsumptions}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {loadingConsumptions ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Calculator className="w-4 h-4" />
                      )}
                      <span className="text-white">Calcular desde InfluxDB</span>
                    </button>
                    <button
                      onClick={() => {
                        loadConsumptions()
                        loadRecipe()
                      }}
                      disabled={loadingConsumptions || loadingRecipe}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {(loadingConsumptions || loadingRecipe) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span className="text-white">Actualizar</span>
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* OF Overview Card - Full Width */}
            <Card className="mb-6">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-400" />
                  Resumen de Orden de Fabricación
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Información de la OF */}
                  <div className="lg:col-span-1 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Datos de la OF</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Número de Orden</p>
                        <p className="text-lg font-bold text-white font-mono">{selectedOrder.OrderNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tipo</p>
                        <p className="text-sm text-gray-300">{selectedOrder.OrderNType || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Producto</p>
                        <p className="text-sm text-white font-medium">{selectedOrder.ProductName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Descripción</p>
                        <p className="text-sm text-gray-300 line-clamp-2">{selectedOrder.ProductDescription || '-'}</p>
                      </div>
                      <div className="pt-2 border-t border-gray-700">
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">Unidad de Medida</p>
                          <Badge variant="secondary">{selectedOrder.MeasurementUnit || 'N/A'}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estado de Avance */}
                  <div className="lg:col-span-1 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Estado de Avance</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">A Producir</p>
                          <p className="text-2xl font-bold text-blue-400">{selectedOrder.QuantityToProduce || '0'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Producido</p>
                          <p className="text-2xl font-bold text-green-400">{selectedOrder.QuantityProduced || '0'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Pendiente</p>
                          <p className="text-2xl font-bold text-orange-400">{selectedOrder.QuantityRemainedToProduce || '0'}</p>
                        </div>
                      </div>
                      
                      {/* Barra de Progreso */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs text-gray-400">Progreso de Producción</p>
                          <p className="text-sm font-bold text-white">
                            {selectedOrder.QuantityToProduce > 0 
                              ? Math.round((selectedOrder.QuantityProduced / selectedOrder.QuantityToProduce) * 100) 
                              : 0}%
                          </p>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-500"
                            style={{ 
                              width: `${selectedOrder.QuantityToProduce > 0 
                                ? (selectedOrder.QuantityProduced / selectedOrder.QuantityToProduce) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>

                      {/* Fechas */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500">Inicio</p>
                          <p className="text-sm text-gray-300">
                            {selectedOrder.StarteddAt 
                              ? new Date(selectedOrder.StarteddAt).toLocaleString('es-ES', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Fin</p>
                          <p className="text-sm text-gray-300">
                            {selectedOrder.FinishedAt 
                              ? new Date(selectedOrder.FinishedAt).toLocaleString('es-ES', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de Receta */}
                  <div className="lg:col-span-1 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Receta</h4>
                    {loadingRecipe ? (
                      <div className="flex items-center justify-center h-full min-h-[200px]">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Cargando...</p>
                        </div>
                      </div>
                    ) : recipe && recipe.Components && recipe.Components.length > 0 ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Código SAP Receta</p>
                          <p className="text-sm font-mono text-white">{recipe.SapCode || selectedOrder.OrderNumber}</p>
                        </div>
                        {recipe.Description && (
                          <div>
                            <p className="text-xs text-gray-500">Descripción</p>
                            <p className="text-sm text-gray-300 line-clamp-2">{recipe.Description}</p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">Componentes</p>
                            <Badge variant="info">
                              {recipe.Components.length} {recipe.Components.length === 1 ? 'componente' : 'componentes'}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto">
                            {recipe.Components.map((component, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-900/50 rounded p-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-mono text-gray-400 truncate">{component.SapCode || '-'}</p>
                                  <p className="text-xs text-gray-500 truncate">{component.Description || '-'}</p>
                                </div>
                                <div className="text-right ml-2">
                                  <p className="text-xs font-medium text-white">{component.RequiredQuantity || '0'}</p>
                                  <p className="text-xs text-gray-500">{component.MeasurementUnitRQ || ''}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[200px]">
                        <div className="text-center">
                          <Package className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-400 mb-3">Sin receta cargada</p>
                          <button
                            onClick={() => loadRecipe(true)}
                            disabled={loadingRecipe}
                            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm transition-colors mx-auto"
                          >
                            {loadingRecipe ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            <span className="text-white text-xs">Cargar desde SAP</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Recipe and Components */}
            {loadingRecipe ? (
              <Card className="mb-6">
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Cargando receta y componentes...</p>
                </div>
              </Card>
            ) : recipe && recipe.Components && recipe.Components.length > 0 ? (
              <Card className="mb-6">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Receta y Componentes</h3>
                    <Badge variant="info">
                      {recipe.Components.length} {recipe.Components.length === 1 ? 'componente' : 'componentes'}
                    </Badge>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-400">Código SAP Receta:</p>
                    <p className="text-lg font-mono text-white">{recipe.SapCode || selectedOrder.OrderNumber}</p>
                    {recipe.Description && (
                      <p className="text-sm text-gray-300 mt-1">{recipe.Description}</p>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Código SAP</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Descripción</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Dosificador(es)</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Cantidad Requerida</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Unidad</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Cantidad Comprometida</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Unidad</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Cantidad Retirada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipe.Components.map((component, index) => (
                          <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                            <td className="py-3 px-4 text-gray-300 font-mono text-sm">{component.SapCode || '-'}</td>
                            <td className="py-3 px-4 text-gray-300">{component.Description || '-'}</td>
                            <td className="py-3 px-4">
                              {component.DosingUnits && component.DosingUnits.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {component.DosingUnits.map((dosingUnit, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {dosingUnit}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-white font-medium">{component.RequiredQuantity || '0'}</td>
                            <td className="py-3 px-4 text-gray-400 text-sm">{component.MeasurementUnitRQ || '-'}</td>
                            <td className="py-3 px-4 text-right text-white font-medium">{component.CommittedQuantity || '0'}</td>
                            <td className="py-3 px-4 text-gray-400 text-sm">{component.MeasurementUnitCQ || '-'}</td>
                            <td className="py-3 px-4 text-right text-white font-medium">{component.WithDrawnQuantity || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            ) : recipe && (!recipe.Components || recipe.Components.length === 0) ? (
              <Card className="mb-6">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Receta</h3>
                    <button
                      onClick={() => loadRecipe(true)}
                      disabled={loadingRecipe}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {loadingRecipe ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span className="text-white">Cargar desde SAP</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">Código SAP: <span className="font-mono text-white">{recipe.SapCode || selectedOrder.OrderNumber}</span></p>
                  {recipe.Description && (
                    <p className="text-sm text-gray-300 mb-4">{recipe.Description}</p>
                  )}
                  <p className="text-sm text-gray-500">No hay componentes registrados para esta receta</p>
                  <p className="text-xs text-gray-600 mt-2">Haz clic en "Cargar desde SAP" para sincronizar la receta y sus componentes</p>
                </div>
              </Card>
            ) : !recipe ? (
              <Card className="mb-6">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Receta y Componentes</h3>
                    <button
                      onClick={() => loadRecipe(true)}
                      disabled={loadingRecipe}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {loadingRecipe ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span className="text-white">Cargar desde SAP</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">No hay receta registrada para esta orden</p>
                  <p className="text-xs text-gray-600">Haz clic en "Cargar desde SAP" para sincronizar la receta y sus componentes</p>
                </div>
              </Card>
            ) : null}

            {/* Consumptions Table */}
            {loadingConsumptions ? (
              <Card>
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Cargando consumos...</p>
                </div>
              </Card>
            ) : consumptions.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <BoxSelect className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No hay consumos registrados para esta orden</p>
                  <p className="text-gray-500 text-sm mt-2 mb-4">
                    Los consumos se calculan desde InfluxDB o se agregan manualmente
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-white">Agregar Consumo Manual</span>
                  </button>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Consumos de Materiales</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Unidad de Dosificación</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Tolva</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Código SAP Receta</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Código SAP Componente</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Cantidad Comprometida</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumptions.map((consumption, index) => (
                          <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                            <td className="py-3 px-4 text-white">{consumption.DosingUnit || '-'}</td>
                            <td className="py-3 px-4 text-gray-300">{consumption.DosingHopper || '-'}</td>
                            <td className="py-3 px-4 text-gray-300 font-mono text-sm">{consumption.RecipeSapCode || '-'}</td>
                            <td className="py-3 px-4 text-gray-300 font-mono text-sm">{consumption.ComponentSapCode || '-'}</td>
                            <td className="py-3 px-4 text-right text-white font-medium">
                              {consumption.CommittedQuantity?.toFixed(2) || '0.00'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleDeleteConsumption(consumption)}
                                  className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Assign Component Modal */}
        {showAssignModal && selectedLine && selectedDoser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {!selectedHopper && !tempHopper ? 'Seleccionar Hopper' : 'Asignar Componente de Receta'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedDoser(null)
                      setSelectedHopper(null)
                      setTempHopper(null)
                    }}
                    className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Información del Dosificador y Hopper (si ya está seleccionado) */}
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
                    {!selectedHopper && !tempHopper ? 'Dosificador:' : 'Asignando a:'}
                  </h4>
                  <div className="space-y-1">
                    <p className="text-sm text-white">
                      <span className="text-gray-400">Dosificador:</span> <span className="font-semibold">{selectedDoser.name}</span>
                    </p>
                    {(selectedHopper || tempHopper) && (
                      <>
                        <p className="text-sm text-white">
                          <span className="text-gray-400">Hopper:</span> <span className="font-semibold">{(selectedHopper || tempHopper).name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          📍 {(selectedHopper || tempHopper).location || 'Sin ubicación'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* PASO 1: Seleccionar Hopper (si no hay uno seleccionado) */}
                {!selectedHopper && !tempHopper && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Seleccionar Hopper Disponible:</h4>
                    {selectedDoser.components && selectedDoser.components.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedDoser.components.map((hopper) => {
                          // Verificar si este hopper ya tiene un componente asignado
                          const isAlreadyAssigned = doserConsumptions.find(
                            c => c.DosingUnit === selectedDoser.name && c.Hopper === hopper.name
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
                                      <p className="text-xs text-green-400">Ya tiene componente asignado: {isAlreadyAssigned.ComponentSapCode}</p>
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

                {/* PASO 2: Seleccionar Componente de la Receta (si ya hay hopper seleccionado) */}
                {(selectedHopper || tempHopper) && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-300">Seleccionar Componente de la Receta:</h4>
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
                        const filteredComponents = selectedLine.recipe.Components.filter(component => {
                          const sapCode = component.SapCode?.trim().toUpperCase() || ''
                          // Solo mostrar componentes que comienzan con RE o RM (excluir RN y PA)
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
                              <p className="text-xs text-gray-600 mt-1">
                                Total en receta: {selectedLine.recipe.Components.length} | Disponibles: 0
                              </p>
                            </div>
                          )
                        }
                        
                        return (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredComponents.map((component, idx) => {
                              const currentHopper = selectedHopper || tempHopper
                              const isAssignedToThisHopper = doserConsumptions.find(
                                c => c.DosingUnit === selectedDoser.name && 
                                     c.Hopper === currentHopper.name && 
                                     c.ComponentSapCode === component.SapCode.trim()
                              )
                              
                              return (
                                <RecipeComponentButton
                                  key={idx}
                                  component={component}
                                  isAssigned={!!isAssignedToThisHopper}
                                  isAssigning={assigningComponent}
                                  onClick={() => handleAssignComponent(component.SapCode.trim())}
                                />
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

                {/* Footer con info y botón cerrar */}
                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <p className="text-xs text-blue-300 mb-2">
                      💡 <strong>Nota:</strong> Los componentes asignados quedan guardados automáticamente. Puedes asignar múltiples componentes y cerrar cuando termines.
                    </p>
                    <p className="text-xs text-purple-300">
                      🔍 <strong>Filtro:</strong> Solo se muestran componentes tipo <span className="font-mono font-semibold">RE</span> y <span className="font-mono font-semibold">RM</span> (componentes <span className="font-mono">RN</span> y <span className="font-mono">PA</span> excluidos).
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedDoser(null)
                      setSelectedHopper(null)
                      setTempHopper(null)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-white font-semibold">Cerrar y Continuar</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Add Consumption Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Agregar Consumo Manual</h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewConsumption({
                        DosingUnit: '',
                        DosingHopper: '',
                        ComponentSapCode: ''
                      })
                      clearError()
                    }}
                    className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
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
                      value={newConsumption.DosingUnit}
                      onChange={(e) => setNewConsumption({ ...newConsumption, DosingUnit: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="Ej: Doser_01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tolva *
                    </label>
                    <input
                      type="text"
                      value={newConsumption.DosingHopper}
                      onChange={(e) => setNewConsumption({ ...newConsumption, DosingHopper: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="Ej: C1, C2, C3..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Código SAP Componente *
                    </label>
                    <input
                      type="text"
                      value={newConsumption.ComponentSapCode}
                      onChange={(e) => setNewConsumption({ ...newConsumption, ComponentSapCode: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                      placeholder="Ej: COMP001"
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-400 mb-4">
                      * La receta será automáticamente la orden seleccionada: <span className="font-mono text-white">{selectedOrder?.OrderNumber}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleAddConsumption}
                      disabled={addingConsumption}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {addingConsumption ? (
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
                      onClick={() => {
                        setShowAddModal(false)
                        setNewConsumption({
                          DosingUnit: '',
                          DosingHopper: '',
                          ComponentSapCode: ''
                        })
                        clearError()
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default MaterialsConsumablesPage // Componente ya migrado desde MaterialsConsumablesPage

