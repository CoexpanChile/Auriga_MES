import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Factory, Calendar, RefreshCw, Loader2, ChevronRight, Home, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useLanguage } from '../../context/LanguageContext'
import { useLineOrders } from '../../hooks/useProductionData'
import { api } from '../../lib/api'

function OrdenesFabricacion() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  
  // Estado para fábrica seleccionada
  const [selectedFactory, setSelectedFactory] = useState(() => {
    const saved = localStorage.getItem('selectedFactory')
    return saved && saved !== 'CX' ? saved : null
  })
  
  const [selectedLine, setSelectedLine] = useState(null)
  const [error, setError] = useState(null)
  const [showDebug, setShowDebug] = useState(false)
  const [linesStatus, setLinesStatus] = useState({}) // Estado de InfluxDB por línea
  
  // Manejar errores de extensiones del navegador
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      // Obtener el mensaje de error de diferentes formas
      let errorMessage = ''
      
      if (event.reason) {
        if (typeof event.reason === 'object' && event.reason.message) {
          errorMessage = event.reason.message
        } else if (typeof event.reason === 'string') {
          errorMessage = event.reason
        } else {
          errorMessage = String(event.reason)
        }
      }
      
      // Filtrar errores comunes de extensiones del navegador
      if (
        errorMessage.includes('A listener indicated an asynchronous response') ||
        errorMessage.includes('message channel closed') ||
        errorMessage.includes('message channel closed before a response was received') ||
        errorMessage.includes('Extension context invalidated') ||
        errorMessage.includes('Receiving end does not exist') ||
        errorMessage.includes('asynchronous response')
      ) {
        // Silenciar estos errores específicos de extensiones
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    // Registrar el listener con capture phase para interceptar antes
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true)
    }
  }, [])
  
  // Escuchar cambios de fábrica
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('selectedFactory')
      const newFactory = saved && saved !== 'CX' ? saved : null
      if (newFactory !== selectedFactory) {
        setSelectedFactory(newFactory)
        setSelectedLine(null) // Limpiar selección al cambiar fábrica
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(handleStorageChange, 1000) // Polling cada segundo
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [selectedFactory])
  
  // Estados para líneas (similar a MaterialesConsumos)
  const [lines, setLines] = useState([])
  const [linesWithData, setLinesWithData] = useState([])
  const [loadingLines, setLoadingLines] = useState(true)
  const [linesError, setLinesError] = useState(null)
  const [loadingLineData, setLoadingLineData] = useState(false)
  
  
  // Helper para normalizar la fábrica de una línea (igual que MaterialesConsumos)
  const getFactoryFromLine = (line) => {
    if (line?.factory) {
      return line.factory
    }
    if (line?.hierarchical_level?.[0]) {
      return line.hierarchical_level[0]
    }
    return ''
  }

  // Función loadLines (igual que MaterialesConsumos)
  const loadLines = async () => {
    try {
      setLoadingLines(true)
      setLinesError(null)
      console.log('🔄 Cargando líneas - OrdenesFabricacion')
      console.log('📍 Factory seleccionada:', selectedFactory)
      
      // Usar /asset/list directamente (igual que MaterialesConsumos)
      const assets = await api.get('/asset/list')
      
      console.log('📦 Assets recibidos de la API:', assets?.length || 0)
      
      // Encontrar el ID de la fábrica seleccionada si existe
      let selectedFactoryId = null
      if (selectedFactory) {
        const factoryAsset = (assets || []).find(a => 
          (a.Code === selectedFactory || a.code === selectedFactory) && 
          (a.ParentID === null || a.parentID === null)
        )
        if (factoryAsset) {
          selectedFactoryId = factoryAsset.ID || factoryAsset.id
          console.log('🏭 Fábrica seleccionada encontrada:', {
            code: factoryAsset.Code || factoryAsset.code,
            id: selectedFactoryId
          })
        }
      }
      
      // Filtrar solo líneas de producción (igual que MaterialesConsumos)
      let linesData = (assets || []).filter(asset => {
        const code = asset.Code || asset.code || ''
        const parentId = asset.ParentID || asset.parentID
        const hierarchicalLevel = asset.hierarchical_level || asset.HierarchicalLevel
        
        // Verificar si es una línea por código
        const isLineByCode = code && (
          code.startsWith('Line_') || 
          code.startsWith('L') ||
          code.toLowerCase().includes('line') ||
          code.match(/^Line_\d+/i) ||
          code.match(/^L\d+/i)
        )
        
        // Verificar si es una línea por hierarchical_level (nivel 2 = fábrica + línea)
        const isLineByLevel = hierarchicalLevel && Array.isArray(hierarchicalLevel) && hierarchicalLevel.length === 2
        
        // Debe tener un ParentID (no es null, es decir, pertenece a una fábrica)
        const hasParent = parentId !== null && parentId !== undefined
        
        const isLine = isLineByCode || isLineByLevel
        
        return isLine && hasParent
      })
      
      console.log('🔍 Líneas encontradas después del filtro inicial:', linesData.length)
      
      // Filtrar por fábrica si se especifica
      if (selectedFactoryId !== null) {
        linesData = linesData.filter(line => {
          const lineParentId = line.ParentID || line.parentID
          return lineParentId === selectedFactoryId
        })
        console.log(`📊 Filtrado: ${linesData.length} líneas después del filtro por fábrica ${selectedFactory}`)
      }
      
      // Si no hay líneas con el filtro estricto, intentar un filtro más permisivo
      if (linesData.length === 0 && assets && assets.length > 0) {
        console.warn('⚠️ No se encontraron líneas con el filtro estricto, intentando filtro más permisivo...')
        
        const fallbackLines = (assets || []).filter(asset => {
          const parentId = asset.ParentID || asset.parentID
          const hierarchicalLevel = asset.hierarchical_level || asset.HierarchicalLevel
          const hasParent = parentId !== null && parentId !== undefined
          const hasTwoLevels = hierarchicalLevel && Array.isArray(hierarchicalLevel) && hierarchicalLevel.length === 2
          return hasParent && hasTwoLevels
        })
        
        if (fallbackLines.length > 0) {
          console.warn(`✅ Encontradas ${fallbackLines.length} líneas con filtro permisivo`)
          linesData = fallbackLines
        }
      }
      
      // Mapear las líneas a un formato consistente
      const mappedLines = linesData.map(line => {
        const parentId = line.ParentID || line.parentID
        const lineCode = line.Code || line.code || ''
        
        // Buscar el asset padre (fábrica) usando el ParentID
        let factoryCode = selectedFactory || ''
        if (parentId !== null && parentId !== undefined && assets) {
          const parentAsset = assets.find(a => (a.ID || a.id) === parentId)
          if (parentAsset) {
            factoryCode = parentAsset.Code || parentAsset.code || selectedFactory || ''
          }
        }
        
        if (!factoryCode) {
          factoryCode = selectedFactory || ''
        }
        
        return {
          ...line,
          code: lineCode,
          id: line.ID || line.id || `line-${lineCode}`,
          parentId: parentId,
          factory: factoryCode,
          line: lineCode,
          hierarchical_level: line.hierarchical_level || [factoryCode, lineCode]
        }
      })
      
      console.log('✅ Líneas cargadas:', mappedLines.length)
      setLines(mappedLines)
      setLinesError(null)
    } catch (err) {
      // Si es un error 401, no mostrar error crítico (ya se está redirigiendo al login)
      if (err.message?.includes('Unauthorized') || err.status === 401) {
        console.warn('🔐 Sesión expirada, se redirigirá al login')
        setLinesError(null) // No mostrar error, solo esperar redirección
        setLines([])
      } else {
        console.error('❌ Error loading lines:', err)
        setLinesError(err)
        setLines([])
      }
    } finally {
      setLoadingLines(false)
    }
  }

  // Función loadLinesWithData (igual que MaterialesConsumos)
  const loadLinesWithData = async () => {
    if (lines.length === 0) {
      console.log('⚠️ No hay líneas para cargar datos')
      setLinesWithData([])
      setLoadingLineData(false)
      return
    }
    
    try {
      setLoadingLineData(true)
      const linesToLoad = lines.slice(0, 10) // Limitar a las primeras 10
      console.log('🔄 Cargando datos completos para', linesToLoad.length, 'líneas')
      
      const linesData = await Promise.all(
        linesToLoad.map(async (line) => {
          try {
            let factory = getFactoryFromLine(line)
            if (!factory && selectedFactory) {
              factory = selectedFactory
            }
            
            const prodLine = line.line || line.code || ''
            const sapCode = line.sap_code || line.code || line.line || ''
            
            if (!factory || !prodLine) {
              return {
                ...line,
                orders: [],
                activeOrder: null,
                recipe: null
              }
            }
            
            // Cargar órdenes para esta línea
            let ordersResponse
            try {
              ordersResponse = await api.post('/sap/orders', {}, {
                headers: {
                  'Content-Type': 'application/json',
                  'Factory': factory,
                  'ProdLine': prodLine,
                  'SapCode': sapCode
                }
              })
            } catch (corsError) {
              try {
                ordersResponse = await api.post('/sap/orders', {}, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Factory': factory,
                    'ProdLine': prodLine,
                    'SapCode': sapCode,
                    'SapRequest': 'false'
                  }
                })
              } catch (retryError) {
                throw corsError
              }
            }
            
            const ordersData = Array.isArray(ordersResponse) ? ordersResponse : []
            console.log(`✅ Órdenes cargadas para ${prodLine}:`, ordersData.length)
            
            // Buscar orden activa
            const activeOrder = ordersData.find(order => 
              order.StarteddAt && !order.FinishedAt
            ) || ordersData[0]
            
            return {
              ...line,
              orders: ordersData,
              activeOrder: activeOrder,
              recipe: null
            }
          } catch (err) {
            console.error(`❌ Error cargando datos para línea:`, err)
            return {
              ...line,
              orders: [],
              activeOrder: null,
              recipe: null,
              error: err.message
            }
          }
        })
      )
      
      console.log('✅ Datos completos cargados:', linesData.length, 'líneas')
      const validLines = linesData.filter(line => line.id || line.code)
      setLinesWithData(validLines)
    } catch (err) {
      // Si es un error 401, no mostrar error crítico (ya se está redirigiendo al login)
      if (err.message?.includes('Unauthorized') || err.status === 401) {
        console.warn('🔐 Sesión expirada al cargar datos de líneas')
      } else {
        console.error('Error loading lines with data:', err)
      }
    } finally {
      setLoadingLineData(false)
    }
  }

  // Cargar líneas cuando cambia la fábrica
  useEffect(() => {
    loadLines()
  }, [selectedFactory])

  // Cargar datos de líneas cuando se cargan las líneas básicas
  useEffect(() => {
    if (lines.length > 0) {
      loadLinesWithData()
    }
  }, [lines])

  // Debug: Log lines cuando cambian
  useEffect(() => {
    console.log('🔍 Estado de líneas:', {
      linesLength: lines.length,
      linesWithDataLength: linesWithData.length,
      loadingLines,
      loadingLineData,
      linesError: linesError?.message,
      selectedFactory
    })
  }, [lines, linesWithData, loadingLines, loadingLineData, linesError, selectedFactory])
  
  // Usar linesWithData directamente (ya viene con órdenes cargadas)
  const linesWithOrders = linesWithData.map(lineData => ({
    line: lineData,
    orders: lineData.orders || [],
    activeOrder: lineData.activeOrder || null,
    isLoading: loadingLineData,
    error: lineData.error
  }))
  
  // Hook para órdenes de la línea seleccionada
  const { data: orders = [], isLoading: loadingOrders, error: ordersError, refetch: refetchOrders } = useLineOrders(selectedLine, false)
  
  // Debug: Log cuando se selecciona una línea o cambian las órdenes
  useEffect(() => {
    if (selectedLine) {
      console.log('🔍 Línea seleccionada:', {
        code: selectedLine.code,
        factory: selectedLine.factory,
        sap_code: selectedLine.sap_code,
        id: selectedLine.id
      })
      console.log('🔍 Estado de órdenes:', {
        ordersCount: orders.length,
        loadingOrders,
        ordersError: ordersError?.message,
        orders: orders.slice(0, 2)
      })
    }
  }, [selectedLine, orders, loadingOrders, ordersError])
  
  const handleRefreshSAP = async () => {
    if (selectedLine) {
      await refetchOrders()
    } else {
      // Recargar líneas y sus datos
      await loadLines()
      if (lines.length > 0) {
        await loadLinesWithData()
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getOrderStatus = (order) => {
    const now = new Date()
    const started = new Date(order.StarteddAt)
    const finished = new Date(order.FinishedAt)
    
    if (now < started) {
      return { text: 'Programada', color: 'info', icon: Calendar }
    } else if (now >= started && now <= finished) {
      return { text: 'En Producción', color: 'success', icon: CheckCircle2 }
    } else {
      return { text: 'Finalizada', color: 'secondary', icon: XCircle }
    }
  }

  const calculateProgress = (produced, toProduce) => {
    if (!produced || !toProduce) return 0
    const producedNum = parseFloat(produced) || 0
    const toProduceNum = parseFloat(toProduce) || 0
    if (toProduceNum === 0) return 0
    return Math.min(100, Math.round((producedNum / toProduceNum) * 100))
  }

  const getCurrentOrder = (line) => {
    // Ya viene en line.activeOrder desde loadLinesWithData
    return line.activeOrder || line.orders?.[0] || null
  }
  
  const isGlobalView = !selectedFactory
  
  // Cargar estado de InfluxDB para las líneas
  useEffect(() => {
    const loadLinesStatus = async () => {
      if (linesWithData.length === 0 || loadingLineData) return
      
      try {
        const lineCodes = linesWithData.map(line => line.code).filter(code => code)
        if (lineCodes.length === 0) return
        
        // Obtener la fábrica de la primera línea o usar selectedFactory
        const factory = selectedFactory || linesWithData[0]?.factory || ''
        if (!factory) return
        
        console.log('🔄 Cargando estado de InfluxDB para líneas:', { factory, lineCodes })
        
        const response = await api.get(`/asset/lines/status?factory=${factory}&lines=${lineCodes.join(',')}`)
        
        // La respuesta puede venir como { data: {...} } o directamente como objeto
        const statusData = response.data || response
        
        // Convertir la respuesta a un objeto más fácil de usar
        const statusMap = {}
        Object.keys(statusData).forEach(lineCode => {
          const statusInfo = statusData[lineCode]
          if (statusInfo && typeof statusInfo === 'object') {
            statusMap[lineCode] = {
              status: statusInfo.status || 'unknown', // 'operativa', 'apagada', 'unknown'
              influx_available: statusInfo.status !== 'unknown' && statusInfo.status !== undefined,
              last_seen: statusInfo.last_seen
            }
          } else {
            statusMap[lineCode] = {
              status: 'unknown',
              influx_available: false
            }
          }
        })
        
        // Para líneas que no están en la respuesta, establecer como desconocidas
        lineCodes.forEach(lineCode => {
          if (!statusMap[lineCode]) {
            statusMap[lineCode] = {
              status: 'unknown',
              influx_available: false
            }
          }
        })
        
        console.log('✅ Estado de InfluxDB cargado:', statusMap)
        setLinesStatus(statusMap)
      } catch (err) {
        console.error('❌ Error al cargar estado de InfluxDB:', err)
        // Si falla, establecer todos como desconocidos
        const unknownStatus = {}
        linesWithData.forEach(line => {
          if (line.code) {
            unknownStatus[line.code] = {
              status: 'unknown',
              influx_available: false
            }
          }
        })
        setLinesStatus(unknownStatus)
      }
    }
    
    loadLinesStatus()
  }, [linesWithData, loadingLineData, selectedFactory])
  
  // Debug: Log del estado de carga
  useEffect(() => {
    console.log('🔍 Estado de carga:', {
      loadingLines,
      loadingLineData,
      linesLength: lines.length,
      linesWithDataLength: linesWithData.length,
      hasError: !!linesError,
      errorMessage: linesError?.message,
      linesStatusCount: Object.keys(linesStatus).length
    })
  }, [loadingLines, loadingLineData, lines.length, linesWithData.length, linesError, linesStatus])
  
  // No bloquear todo el renderizado si hay líneas, solo mostrar loading en la sección específica
  // if (loadingLines && lines.length === 0) {
  //   return (
  //     <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
  //       <div className="text-center">
  //         <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
  //         <p className="text-gray-400">{t.common?.loading || 'Cargando líneas de producción...'}</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {t.produccion?.ordenesFabricacion?.title || 'Órdenes de Fabricación'}
                </h1>
                <p className="text-gray-400 mt-1">
                  {isGlobalView ? 'Todas las fábricas' : `Fábrica: ${selectedFactory}`}
                </p>
              </div>
            </div>
          </div>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              {t.dashboard?.title || 'Dashboard'}
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{t.produccion?.ordenesFabricacion?.title || 'Órdenes de Fabricación'}</span>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Indicadores Principales */}
        {!selectedLine && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total de Líneas */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Factory className="w-8 h-8 text-blue-400" />
                  {loadingLines && (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {loadingLines ? '...' : linesWithData.length || lines.length}
                </h3>
                <p className="text-sm text-gray-400">Líneas de Producción</p>
              </div>
            </Card>

            {/* Líneas Operativas */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {linesWithData.filter(line => {
                    const status = linesStatus[line.code]
                    return status?.status === 'operativa'
                  }).length}
                </h3>
                <p className="text-sm text-gray-400">Líneas Operativas</p>
              </div>
            </Card>

            {/* Total de Órdenes */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {linesWithData.reduce((total, line) => total + (line.orders?.length || 0), 0)}
                </h3>
                <p className="text-sm text-gray-400">Total de Órdenes</p>
              </div>
            </Card>

            {/* Líneas con Orden Activa */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {linesWithData.filter(line => line.activeOrder).length}
                </h3>
                <p className="text-sm text-gray-400">Líneas con Orden Activa</p>
              </div>
            </Card>
          </div>
        )}

        {/* Debug Panel */}
        {showDebug && (
          <Card className="mb-6">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">🔍 Debug Logs</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDebugLogs([])}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={() => setShowDebug(false)}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                  >
                    Ocultar
                  </button>
                </div>
              </div>
              <div className="bg-gray-950 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
                {debugLogs.length === 0 ? (
                  <p className="text-gray-500">No hay logs aún. Recarga la página para ver los logs.</p>
                ) : (
                  debugLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`mb-2 ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'warn' ? 'text-yellow-400' :
                        'text-gray-300'
                      }`}
                    >
                      <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                      <span className={log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : ''}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        )}
        
        {!showDebug && (
          <div className="mb-6">
            <button
              onClick={() => setShowDebug(true)}
              className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded"
            >
              Mostrar Debug Logs
            </button>
          </div>
        )}

        {/* Lines Selection */}
        {!selectedLine && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {t.produccion?.ordenesFabricacion?.selectLine || 'Seleccionar Línea de Producción'}
              </h2>
              {(() => {
                console.log('🔍 Estado de renderizado en UI:', {
                  loadingLines,
                  loadingLineData,
                  linesError: linesError?.message,
                  linesLength: lines.length,
                  linesWithDataLength: linesWithData.length,
                  selectedFactory
                })
                return null
              })()}
              {loadingLines || loadingLineData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
                  <p className="text-gray-400">Cargando líneas de producción...</p>
                </div>
              ) : linesError ? (
                <div className="flex items-center justify-center py-8">
                  <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                  <p className="text-red-400">Error al cargar líneas: {linesError.message || 'Error desconocido'}</p>
                </div>
              ) : linesWithData.length === 0 ? (
                <div className="text-center py-8">
                  <Factory className="w-12 h-12 text-gray-600 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-400">{t.common?.noData || 'No hay líneas disponibles'}</p>
                  {selectedFactory && (
                    <p className="text-sm text-gray-500 mt-2">Fábrica seleccionada: {selectedFactory}</p>
                  )}
                  {lines.length > 0 && linesWithData.length === 0 && (
                    <p className="text-sm text-yellow-400 mt-2">Líneas encontradas pero sin datos cargados</p>
                  )}
                  <div className="mt-4 text-xs text-gray-600">
                    <p>Debug: loadingLines={String(loadingLines)}, loadingLineData={String(loadingLineData)}</p>
                    <p>lines.length={lines.length}, linesWithData.length={linesWithData.length}</p>
                    {linesError && <p className="text-red-400">Error: {linesError.message}</p>}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {linesWithData.map((line, index) => {
                    const currentOrder = line.activeOrder || line.orders?.[0] || null
                    const orderStatus = currentOrder ? getOrderStatus(currentOrder) : null
                    const orderProgress = currentOrder ? calculateProgress(
                      currentOrder.QuantityProduced, 
                      currentOrder.QuantityToProduce
                    ) : 0
                    
                    // Obtener estado de InfluxDB
                    const lineStatus = linesStatus[line.code] || {
                      status: 'unknown',
                      influx_available: line.influx_available || false
                    }
                    
                    // Determinar el estado operativo
                    const isOperativo = lineStatus.status === 'operativa'
                    const isApagada = lineStatus.status === 'apagada'
                    const statusText = isOperativo ? 'Operativo' : isApagada ? 'Apagada' : 'Sin datos'
                    const statusVariant = isOperativo ? 'success' : isApagada ? 'secondary' : 'secondary'
                    
                    // Asegurar que haya un key único
                    const lineKey = line.id || line.code || `line-${index}`
                    
                    return (
                      <button
                        key={lineKey}
                        onClick={() => {
                          console.log('🖱️ Línea seleccionada:', {
                            id: line.id,
                            code: line.code,
                            factory: line.factory,
                            sap_code: line.sap_code,
                            location: line.location
                          })
                          setSelectedLine(line)
                        }}
                        className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Factory className={`w-5 h-5 ${isOperativo ? 'text-green-400' : isApagada ? 'text-gray-500' : 'text-blue-400'}`} />
                          <Badge variant={statusVariant}>
                            {statusText}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-white mb-1">{line.line}</h3>
                        <p className="text-sm text-gray-400 mb-3">{line.location || line.factory}</p>
                        
                        {currentOrder ? (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-400">Orden de Fabricación</span>
                              {orderStatus && (
                                <Badge variant={orderStatus.color} className="text-xs">
                                  {orderStatus.text}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">OF:</span>
                                <span className="text-sm font-semibold text-white">{currentOrder.OrderNumber}</span>
                              </div>
                              {currentOrder.ProductName && (
                                <p className="text-xs font-medium text-white">
                                  {currentOrder.ProductName}
                                </p>
                              )}
                              {currentOrder.ProductDescription && (
                                <p className="text-xs text-gray-300 line-clamp-2">
                                  {currentOrder.ProductDescription}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">
                                  Producido: <span className="text-white font-medium">
                                    {currentOrder.QuantityProduced || '0'}
                                  </span> / <span className="text-gray-400">
                                    {currentOrder.QuantityToProduce || '0'}
                                  </span> {currentOrder.MeasurementUnit || ''}
                                </span>
                              </div>
                              {currentOrder.QuantityRemainedToProduce && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-orange-400 font-medium">
                                    Pendiente: {currentOrder.QuantityRemainedToProduce} {currentOrder.MeasurementUnit || ''}
                                  </span>
                                </div>
                              )}
                              {orderProgress > 0 && (
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                  <div
                                    className="h-full bg-blue-600 rounded-full transition-all"
                                    style={{ width: `${orderProgress}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-xs text-gray-500">Sin orden de fabricación</p>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Orders Display */}
        {selectedLine && (
          <>
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedLine(null)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedLine.line}</h2>
                      <p className="text-gray-400">{selectedLine.location || selectedLine.factory}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRefreshSAP}
                    disabled={loadingOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {loadingOrders ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span className="text-white">Actualizar desde SAP</span>
                  </button>
                </div>
              </div>
            </Card>

            {loadingOrders ? (
              <Card>
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">{t.common?.loading || 'Cargando órdenes de producción...'}</p>
                  {selectedLine && (
                    <p className="text-gray-500 text-sm mt-2">
                      Línea: {selectedLine.code} | Fábrica: {selectedLine.factory || 'N/A'}
                    </p>
                  )}
                </div>
              </Card>
            ) : ordersError ? (
              <Card>
                <div className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-red-400 text-lg">Error al cargar órdenes</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {ordersError.message || 'Error desconocido'}
                  </p>
                  <button
                    onClick={() => refetchOrders()}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Reintentar
                  </button>
                </div>
              </Card>
            ) : orders.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">{t.common?.noData || 'No hay órdenes de producción disponibles'}</p>
                  {selectedLine && (
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Línea: {selectedLine.code}</p>
                      <p>Fábrica: {selectedLine.factory || 'N/A'}</p>
                      <p>SAP Code: {selectedLine.sap_code || 'N/A'}</p>
                    </div>
                  )}
                  <p className="text-gray-500 text-sm mt-4">
                    Haz clic en "Actualizar desde SAP" para sincronizar las órdenes
                  </p>
                </div>
              </Card>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {orders.map((order, index) => {
                    const status = getOrderStatus(order)
                    const progress = calculateProgress(order.QuantityProduced, order.QuantityToProduce)
                    const StatusIcon = status.icon
                    
                    return (
                      <Card key={index} className="overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-white">{order.OrderNumber}</h3>
                                <Badge variant={status.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {status.text}
                                </Badge>
                                {order.OrderNType && (
                                  <Badge variant="secondary">{order.OrderNType}</Badge>
                                )}
                              </div>
                              <p className="text-lg text-gray-300 mb-1">{order.ProductName}</p>
                              {order.ProductDescription && (
                                <p className="text-sm text-gray-400">{order.ProductDescription}</p>
                              )}
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-400">Progreso de Producción</span>
                              <span className="text-sm font-semibold text-white">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-2 text-sm">
                              <span className="text-gray-400">
                                Producido: <span className="text-white font-medium">{order.QuantityProduced || '0'}</span> {order.MeasurementUnit || ''}
                              </span>
                              <span className="text-gray-400">
                                Objetivo: <span className="text-white font-medium">{order.QuantityToProduce || '0'}</span> {order.MeasurementUnit || ''}
                              </span>
                              {order.QuantityRemainedToProduce && (
                                <span className="text-gray-400">
                                  Restante: <span className="text-white font-medium">{order.QuantityRemainedToProduce}</span> {order.MeasurementUnit || ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Inicio Programado</span>
                              </div>
                              <p className="text-white font-medium">{formatDate(order.StarteddAt)}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Fin Programado</span>
                              </div>
                              <p className="text-white font-medium">{formatDate(order.FinishedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>

                {/* Historial de últimas 10 órdenes */}
                {orders.length > 0 && (
                  <Card className="mb-6">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-400" />
                          Historial de Órdenes de Fabricación
                        </h3>
                        <Badge variant="secondary">
                          Últimas {Math.min(10, orders.length)} órdenes
                        </Badge>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Orden</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Producto</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Estado</th>
                              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Progreso</th>
                              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Producido</th>
                              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Objetivo</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Inicio</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Fin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders
                              .sort((a, b) => {
                                // Ordenar por fecha de inicio (más recientes primero)
                                const dateA = a.StarteddAt ? new Date(a.StarteddAt) : new Date(0)
                                const dateB = b.StarteddAt ? new Date(b.StarteddAt) : new Date(0)
                                return dateB - dateA
                              })
                              .slice(0, 10)
                              .map((order, index) => {
                                const status = getOrderStatus(order)
                                const progress = calculateProgress(order.QuantityProduced, order.QuantityToProduce)
                                const StatusIcon = status.icon
                                
                                return (
                                  <tr 
                                    key={order.OrderNumber || index} 
                                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                  >
                                    <td className="py-3 px-4">
                                      <span className="font-semibold text-white">{order.OrderNumber}</span>
                                      {order.OrderNType && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          {order.OrderNType}
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      <div>
                                        <p className="text-white text-sm font-medium">{order.ProductName || 'N/A'}</p>
                                        {order.ProductDescription && (
                                          <p className="text-gray-400 text-xs line-clamp-1">{order.ProductDescription}</p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <Badge variant={status.color} className="text-xs">
                                        <StatusIcon className="w-3 h-3 mr-1 inline" />
                                        {status.text}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="text-white text-sm font-medium">{progress}%</span>
                                        <div className="w-16 bg-gray-700 rounded-full h-2 overflow-hidden">
                                          <div
                                            className="h-full bg-blue-600 transition-all"
                                            style={{ width: `${progress}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <span className="text-white text-sm">
                                        {order.QuantityProduced || '0'} {order.MeasurementUnit || ''}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <span className="text-gray-400 text-sm">
                                        {order.QuantityToProduce || '0'} {order.MeasurementUnit || ''}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-gray-400 text-sm">{formatDate(order.StarteddAt)}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-gray-400 text-sm">{formatDate(order.FinishedAt)}</span>
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                      
                      {orders.length === 0 && (
                        <div className="text-center py-8">
                          <Package className="w-12 h-12 text-gray-600 mx-auto mb-2 opacity-50" />
                          <p className="text-gray-400">No hay órdenes en el historial</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OrdenesFabricacion

