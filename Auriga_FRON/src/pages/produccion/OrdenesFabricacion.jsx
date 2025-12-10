import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Factory, Calendar, RefreshCw, Loader2, ChevronRight, Home, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useLanguage } from '../../context/LanguageContext'
import { useProductionLines, useLinesWithData, useSyncAllLines } from '../../hooks/useProductionData'
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
      // Filtrar errores comunes de extensiones del navegador
      if (event.reason && typeof event.reason === 'object' && event.reason.message) {
        const message = event.reason.message
        if (
          message.includes('A listener indicated an asynchronous response') ||
          message.includes('message channel closed') ||
          message.includes('Extension context invalidated') ||
          message.includes('Receiving end does not exist')
        ) {
          // Silenciar estos errores específicos de extensiones
          event.preventDefault()
          return
        }
      }
      
      // También verificar si es un string
      const errorMessage = event.reason?.message || String(event.reason || '')
      if (
        errorMessage.includes('A listener indicated an asynchronous response') ||
        errorMessage.includes('message channel closed') ||
        errorMessage.includes('Extension context invalidated')
      ) {
        event.preventDefault()
        return
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
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
  
  // React Query hooks
  const { data: lines = [], isLoading: loadingLines, error: linesError } = useProductionLines(selectedFactory)
  const linesWithDataQueries = useLinesWithData(lines)
  const syncAllLines = useSyncAllLines()
  
  
  // Debug: Log lines cuando cambian
  useEffect(() => {
    const logData = {
      linesLength: lines.length,
      loadingLines,
      linesError: linesError?.message,
      selectedFactory,
      lines: lines.slice(0, 3).map(l => ({
        id: l.id,
        code: l.code,
        line: l.line,
        factory: l.factory
      }))
    }
    console.log('🔍 useProductionLines estado:', logData)
    
    if (lines.length > 0) {
      console.log('✅ Líneas disponibles en OrdenesFabricacion:', lines.length, lines)
    } else if (!loadingLines && !linesError) {
      console.warn('⚠️ No hay líneas disponibles después de cargar. Factory:', selectedFactory)
    }
  }, [lines, loadingLines, linesError, selectedFactory])
  
  // Obtener datos de líneas con órdenes
  // useQueries retorna un array de objetos de query con { data, isLoading, error, ... }
  const linesWithOrders = linesWithDataQueries.map((query, index) => {
    const line = lines[index]
    if (!line) {
      console.warn(`⚠️ No hay línea en índice ${index}`)
      return null
    }
    const lineData = {
      line: line,
      orders: query.data?.orders || [],
      activeOrder: query.data?.activeOrder || null,
      isLoading: query.isLoading,
      error: query.error
    }
    
    // Debug: Log cuando se cargan órdenes para una línea
    if (lineData.orders.length > 0 && !query.isLoading) {
      console.log(`✅ Órdenes cargadas para línea ${line.code}:`, {
        ordersCount: lineData.orders.length,
        activeOrder: lineData.activeOrder?.OrderNumber || 'N/A'
      })
    }
    
    return lineData
  }).filter(Boolean) // Filtrar nulls
  
  // Debug: Log del estado de las queries
  useEffect(() => {
    if (lines.length > 0) {
      console.log('🔍 Estado de useLinesWithData:', {
        linesCount: lines.length,
        queriesCount: linesWithDataQueries.length,
        queriesLoading: linesWithDataQueries.filter(q => q.isLoading).length,
        queriesWithData: linesWithDataQueries.filter(q => q.data).length,
        queriesWithError: linesWithDataQueries.filter(q => q.error).length,
        linesWithOrdersCount: linesWithOrders.length
      })
    }
  }, [lines, linesWithDataQueries, linesWithOrders])
  
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
      // Sincronizar todas las líneas
      await syncAllLines.mutateAsync(lines)
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
    const lineData = linesWithOrders.find(item => item.line?.id === line.id || item.line?.code === line.code)
    return lineData?.activeOrder || lineData?.orders?.[0] || null
  }
  
  const isGlobalView = !selectedFactory
  
  // Cargar estado de InfluxDB para las líneas
  useEffect(() => {
    const loadLinesStatus = async () => {
      if (lines.length === 0 || loadingLines) return
      
      try {
        const lineCodes = lines.map(line => line.code).filter(code => code)
        if (lineCodes.length === 0) return
        
        // Obtener la fábrica de la primera línea o usar selectedFactory
        const factory = selectedFactory || lines[0]?.factory || ''
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
        lines.forEach(line => {
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
  }, [lines, loadingLines, selectedFactory])
  
  // Debug: Log del estado de carga
  useEffect(() => {
    console.log('🔍 Estado de carga:', {
      loadingLines,
      linesLength: lines.length,
      hasError: !!linesError,
      errorMessage: linesError?.message,
      linesStatusCount: Object.keys(linesStatus).length
    })
  }, [loadingLines, lines.length, linesError, linesStatus])
  
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
                  {loadingLines ? '...' : lines.length}
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
                  {lines.filter(line => {
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
                  {linesWithOrders.reduce((total, item) => total + (item.orders?.length || 0), 0)}
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
                  {linesWithOrders.filter(item => item.activeOrder).length}
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
                  linesError: linesError?.message,
                  linesLength: lines.length,
                  selectedFactory,
                  linesSample: lines.slice(0, 3).map(l => ({
                    id: l.id,
                    code: l.code,
                    line: l.line,
                    factory: l.factory
                  }))
                })
                return null
              })()}
              {loadingLines ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
                  <p className="text-gray-400">Cargando líneas de producción...</p>
                </div>
              ) : linesError ? (
                <div className="flex items-center justify-center py-8">
                  <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                  <p className="text-red-400">Error al cargar líneas: {linesError.message || 'Error desconocido'}</p>
                </div>
              ) : lines.length === 0 ? (
                <div className="text-center py-8">
                  <Factory className="w-12 h-12 text-gray-600 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-400">{t.common?.noData || 'No hay líneas disponibles'}</p>
                  {selectedFactory && (
                    <p className="text-sm text-gray-500 mt-2">Fábrica seleccionada: {selectedFactory}</p>
                  )}
                  <div className="mt-4 text-xs text-gray-600">
                    <p>Debug: loadingLines={String(loadingLines)}, lines.length={lines.length}</p>
                    {linesError && <p className="text-red-400">Error: {linesError.message}</p>}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lines.map((line, index) => {
                    const currentOrder = getCurrentOrder(line)
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
              <div className="space-y-4">
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
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OrdenesFabricacion
