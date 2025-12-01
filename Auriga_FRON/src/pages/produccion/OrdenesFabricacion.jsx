import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Factory, Calendar, RefreshCw, Loader2, ChevronRight, Home, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { api } from '../../lib/api'
import { useLanguage } from '../../context/LanguageContext'

function OrdenesFabricacion() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  
  // Obtener fábrica seleccionada desde localStorage (sin prefijo en URL)
  const selectedFactory = useMemo(() => {
    const saved = localStorage.getItem('selectedFactory')
    return saved && saved !== 'CX' ? saved : null
  }, [])
  
  const isGlobalView = !selectedFactory
  
  const [lines, setLines] = useState([])
  const [linesWithOrders, setLinesWithOrders] = useState([])
  const [selectedLine, setSelectedLine] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [refreshSAP, setRefreshSAP] = useState(false)

  useEffect(() => {
    loadLines()
  }, [selectedFactory])

  useEffect(() => {
    if (lines.length > 0) {
      loadOrdersForAllLines()
    }
  }, [lines])

  useEffect(() => {
    if (selectedLine) {
      loadOrders()
      const interval = setInterval(loadOrders, 60000)
      return () => clearInterval(interval)
    }
  }, [selectedLine, refreshSAP])

  useEffect(() => {
    if (lines.length > 0) {
      const interval = setInterval(() => {
        loadOrdersForAllLines()
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [lines])

  const loadLines = async () => {
    try {
      setLoading(true)
      
      // Usar /asset/list y filtrar en el cliente (evita CORS y 404)
      const assets = await api.get('/asset/list')
      
      // Filtrar solo líneas de producción
      let lines = (assets || []).filter(asset => 
        asset.hierarchical_level && 
        asset.hierarchical_level.length >= 2 &&
        asset.hierarchical_level[1]?.startsWith('L')
      )
      
      // Filtrar por fábrica si se especifica
      if (selectedFactory) {
        lines = lines.filter(line => 
          line.location?.includes(selectedFactory) || 
          line.hierarchical_level?.[0] === selectedFactory ||
          line.factory === selectedFactory
        )
      }
      
      setLines(lines)
      setError(null)
    } catch (err) {
      console.error('Error loading lines:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const loadOrdersForAllLines = async () => {
    const ordersPromises = lines.map(async (line) => {
      try {
        const sapCode = line.sap_code || line.code || line.line || ''
        const headers = {
          'Factory': line.factory,
          'ProdLine': line.line,
          'SapCode': sapCode,
          'SapRequest': 'false'
        }
        
        const data = await api.post('/sap/orders', {}, { headers })
        
        const ordersData = Array.isArray(data) ? data : []
        return { line, orders: ordersData }
      } catch (err) {
        console.error(`Error loading orders for ${line.line}:`, err)
        return { line, orders: [] }
      }
    })
    
    const results = await Promise.all(ordersPromises)
    setLinesWithOrders(results)
  }

  const loadOrders = async () => {
    if (!selectedLine) return
    
    try {
      setLoadingOrders(true)
      
      const sapCode = selectedLine.sap_code || selectedLine.code || selectedLine.line || ''
      
      const headers = {
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'SapCode': sapCode,
        'SapRequest': refreshSAP ? 'true' : 'false'
      }
      
      const data = await api.post('/sap/orders', {}, { headers })
      
      setOrders(Array.isArray(data) ? data : [])
      setLastUpdate(new Date())
      setError(null)
      setRefreshSAP(false)
      
      setLinesWithOrders(prev => prev.map(item => 
        item.line.id === selectedLine.id 
          ? { ...item, orders: Array.isArray(data) ? data : [] }
          : item
      ))
    } catch (err) {
      console.error('Error loading orders:', err)
      if (err.message?.includes('403')) {
        setError('No tienes permisos para acceder a las órdenes de producción')
      } else if (err.message?.includes('401')) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente')
      } else {
        setError('Error al cargar las órdenes de producción')
      }
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleRefreshSAP = () => {
    setRefreshSAP(true)
    loadOrders()
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
    const lineData = linesWithOrders.find(item => item.line.id === line.id)
    if (!lineData || !lineData.orders || lineData.orders.length === 0) {
      return null
    }
    
    const now = new Date()
    const activeOrder = lineData.orders.find(order => {
      const started = new Date(order.StarteddAt)
      const finished = new Date(order.FinishedAt)
      return now >= started && now <= finished
    })
    
    return activeOrder || lineData.orders[0] || null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t.common?.loading || 'Cargando líneas de producción...'}</p>
        </div>
      </div>
    )
  }

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
            {lastUpdate && (
              <div className="text-sm text-gray-400">
                Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
              </div>
            )}
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

        {/* Lines Selection */}
        {!selectedLine && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {t.produccion?.ordenesFabricacion?.selectLine || 'Seleccionar Línea de Producción'}
              </h2>
              {lines.length === 0 ? (
                <p className="text-gray-400">{t.common?.noData || 'No hay líneas disponibles'}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lines.map((line) => {
                    const currentOrder = getCurrentOrder(line)
                    const orderStatus = currentOrder ? getOrderStatus(currentOrder) : null
                    const orderProgress = currentOrder ? calculateProgress(
                      currentOrder.QuantityProduced, 
                      currentOrder.QuantityToProduce
                    ) : 0
                    
                    return (
                      <button
                        key={line.id}
                        onClick={() => setSelectedLine(line)}
                        className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Factory className="w-5 h-5 text-blue-400" />
                          <Badge variant={line.influx_available ? 'success' : 'secondary'}>
                            {line.influx_available ? 'Activa' : 'Sin datos'}
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
                                  </span>
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
                </div>
              </Card>
            ) : orders.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">{t.common?.noData || 'No hay órdenes de producción disponibles'}</p>
                  <p className="text-gray-500 text-sm mt-2">
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
