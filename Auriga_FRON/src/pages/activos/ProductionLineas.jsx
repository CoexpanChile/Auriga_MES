import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Factory, Activity, Zap, Clock, TrendingUp, Loader2, RefreshCw, ChevronRight, Home } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { api } from '../../lib/api'
import { useLanguage } from '../../context/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'

// Orden fijo de fábricas (orden descendente de prioridad)
const FACTORY_ORDER = [
  'FPC', 'FPL', 'FSP', 'CXM', 'CXF', 'CXE', 'CXD', 'CXC', 'CXB', 
  'EXT', 'MNT', 'RTP', 'ITC'
]

// Componente para mostrar líneas de producción
// Usa /asset/list y filtra las líneas basándose en hierarchical_level
function ProductionLineas() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { permissions, checkFactoryAccess } = usePermissions()
  
  // Función para obtener la primera fábrica disponible según el orden fijo
  const getFirstAvailableFactory = () => {
    if (!permissions) return null
    
    // Buscar la primera fábrica del orden que el usuario tenga acceso
    for (const factory of FACTORY_ORDER) {
      if (checkFactoryAccess(factory)) {
        return factory
      }
    }
    
    // Si no encuentra ninguna, retornar null
    return null
  }
  
  // Obtener fábrica seleccionada desde localStorage o seleccionar automáticamente
  const getSelectedFactory = () => {
    const saved = localStorage.getItem('selectedFactory')
    
    // Si hay una guardada y es válida, usarla
    if (saved && saved !== 'CX') {
      if (permissions) {
        const hasAccess = checkFactoryAccess(saved)
        if (hasAccess) {
          return saved
        }
      } else {
        // Si permissions aún no está disponible, confiar en localStorage
        return saved
      }
    }
    
    // Si no hay guardada o no es válida, seleccionar automáticamente la primera disponible
    const firstFactory = getFirstAvailableFactory()
    if (firstFactory) {
      localStorage.setItem('selectedFactory', firstFactory)
      return firstFactory
    }
    
    return null
  }
  
  // Inicializar selectedFactory
  const [selectedFactory, setSelectedFactory] = useState(() => {
    const saved = localStorage.getItem('selectedFactory')
    // Si es 'CX', retornar null (vista global)
    if (saved === 'CX') return null
    // Para otras fábricas, retornar el valor directamente
    return saved || null
  })
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [lastThroughputUpdate, setLastThroughputUpdate] = useState(null)

  // Seleccionar automáticamente la primera fábrica disponible cuando permissions esté disponible
  useEffect(() => {
    if (permissions && !selectedFactory) {
      // Buscar la primera fábrica del orden que el usuario tenga acceso
      for (const factory of FACTORY_ORDER) {
        if (checkFactoryAccess(factory)) {
          localStorage.setItem('selectedFactory', factory)
          setSelectedFactory(factory)
          // Disparar evento para notificar a otros componentes
          window.dispatchEvent(new CustomEvent('factoryChanged', { 
            detail: { factory } 
          }))
          return
        }
      }
    }
  }, [permissions, checkFactoryAccess])

  // Actualizar selectedFactory cuando permissions esté disponible para validar acceso
  useEffect(() => {
    if (permissions && selectedFactory) {
      // Validar que el usuario tenga acceso a la fábrica seleccionada
      const hasAccess = checkFactoryAccess(selectedFactory)
      if (!hasAccess) {
        localStorage.removeItem('selectedFactory')
        setSelectedFactory(null)
        // Intentar seleccionar automáticamente la primera disponible
        for (const factory of FACTORY_ORDER) {
          if (checkFactoryAccess(factory)) {
            localStorage.setItem('selectedFactory', factory)
            setSelectedFactory(factory)
            window.dispatchEvent(new CustomEvent('factoryChanged', { 
              detail: { factory } 
            }))
            return
          }
        }
      }
    }
  }, [permissions, checkFactoryAccess, selectedFactory])

  // Escuchar cambios en localStorage para actualizar selectedFactory
  useEffect(() => {
    const handleFactoryChange = (event) => {
      const newFactory = event?.detail?.factory || localStorage.getItem('selectedFactory')
      
      if (!newFactory || newFactory === 'CX') {
        if (selectedFactory !== null) {
          setSelectedFactory(null)
        }
        return
      }
      
      // Verificar acceso si permissions está disponible
      if (permissions) {
        const hasAccess = checkFactoryAccess(newFactory)
        if (!hasAccess) {
          localStorage.removeItem('selectedFactory')
          if (selectedFactory !== null) {
            setSelectedFactory(null)
          }
          return
        }
      }
      
      // Actualizar si cambió la fábrica
      if (selectedFactory !== newFactory) {
        setSelectedFactory(newFactory)
      }
    }

    const handleStorageChange = (e) => {
      if (e.key === 'selectedFactory') {
        handleFactoryChange()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('factoryChanged', handleFactoryChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('factoryChanged', handleFactoryChange)
    }
  }, [permissions, checkFactoryAccess, selectedFactory])

  // Revalidar selectedFactory cuando cambien los permisos
  useEffect(() => {
    if (permissions) {
      const saved = localStorage.getItem('selectedFactory')
      if (!saved) {
        if (selectedFactory) setSelectedFactory(null)
        return
      }
      
      if (saved === 'CX') {
        const hasCXAccess = checkFactoryAccess('CX')
        if (!hasCXAccess && selectedFactory) {
          localStorage.removeItem('selectedFactory')
          setSelectedFactory(null)
        }
      } else {
        const hasAccess = checkFactoryAccess(saved)
        if (!hasAccess) {
          localStorage.removeItem('selectedFactory')
          if (selectedFactory) setSelectedFactory(null)
        } else if (selectedFactory !== saved) {
          setSelectedFactory(saved)
        }
      }
    }
  }, [permissions, checkFactoryAccess, selectedFactory])

  // Recargar líneas cuando cambie selectedFactory
  useEffect(() => {
    // Usar un pequeño delay para asegurar que el estado se haya actualizado
    const timer = setTimeout(() => {
      loadLines()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [selectedFactory]) // Recargar cuando cambie la fábrica

  useEffect(() => {
    // Actualizar estado de líneas cada 30 segundos
    const statusInterval = setInterval(() => {
      loadLinesStatusOnly()
    }, 30000)
    
    // Actualizar throughput cada 20 minutos (1200000 ms)
    const throughputInterval = setInterval(() => {
      loadLinesThroughput()
    }, 20 * 60 * 1000)
    
    return () => {
      clearInterval(statusInterval)
      clearInterval(throughputInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  const loadLines = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Usar /asset/list y filtrar las líneas de producción
      const response = await api.get('/asset/list')
      
      // La respuesta podría ser un array directo o un objeto con datos
      let assetsArray = []
      if (Array.isArray(response)) {
        assetsArray = response
      } else if (response && Array.isArray(response.data)) {
        assetsArray = response.data
      } else if (response && Array.isArray(response.assets)) {
        assetsArray = response.assets
      } else {
        setLines([])
        setError('Formato de respuesta inesperado')
        return
      }
      
      // Normalizar campos como en JerarquiaActivos
      const normalizeAsset = (asset) => {
        return {
          id: asset.ID !== undefined ? asset.ID : asset.id,
          code: asset.Code !== undefined ? asset.Code : asset.code,
          location: asset.Location !== undefined ? asset.Location : asset.location,
          factory: asset.Factory !== undefined ? asset.Factory : asset.factory,
          hierarchical_level: asset.HierarchicalLevel !== undefined ? asset.HierarchicalLevel : asset.hierarchical_level,
          parentId: asset.ParentID !== undefined ? asset.ParentID : asset.ParentId !== undefined ? asset.ParentId : asset.parentId,
          sap_code: asset.sap_code || asset.SapCode || asset.sapCode,
          mr_products: asset.mr_products || asset.MrProducts || asset.mrProducts,
          ...asset // Mantener todos los campos originales
        }
      }
      
      const normalizedAssets = assetsArray.map(normalizeAsset)
      
      // Crear mapa de assets por ID para buscar padres
      const assetMap = new Map()
      normalizedAssets.forEach(asset => {
        if (asset.id != null) {
          assetMap.set(asset.id, asset)
        }
      })
      
      // Identificar fábricas (nodos raíz sin parentId)
      const factories = new Set()
      normalizedAssets.forEach(asset => {
        if (asset.id != null && (asset.parentId == null || asset.parentId === null || asset.parentId === '')) {
          factories.add(asset.id)
        }
      })
      
      // Filtrar líneas de producción
      // Las líneas pueden ser:
      // 1. Assets con hierarchical_level con 2 elementos (Fábrica, Línea)
      // 2. Assets con código que empiece con "Line_" o contenga "LINE"
      // 3. Assets que son hijos directos de fábricas (parentId apunta a una fábrica)
      const lines = normalizedAssets
        .filter(asset => {
          // Opción 1: Filtrar por hierarchical_level (debe tener exactamente 2 niveles: Fábrica y Línea)
          if (asset.hierarchical_level && Array.isArray(asset.hierarchical_level)) {
            return asset.hierarchical_level.length === 2
          }
          
          // Opción 2: Filtrar por código que empiece con "Line_" o contenga "LINE"
          if (asset.code) {
            const code = asset.code.toUpperCase()
            return code.startsWith('LINE_') || code.includes('LINE')
          }
          
          // Opción 3: Si tiene parentId y el padre es una fábrica, es una línea
          if (asset.parentId != null && factories.has(asset.parentId)) {
            return true
          }
          
          return false
        })
        .map(asset => {
          // Extraer fábrica del hierarchical_level, del campo factory, o del padre
          let factory = ''
          if (asset.hierarchical_level && Array.isArray(asset.hierarchical_level) && asset.hierarchical_level.length > 0) {
            factory = asset.hierarchical_level[0]
          } else if (asset.factory) {
            factory = asset.factory
          } else if (asset.parentId != null && factories.has(asset.parentId)) {
            // Si es hijo de una fábrica, obtener el código de la fábrica
            const parentAsset = assetMap.get(asset.parentId)
            if (parentAsset) {
              factory = parentAsset.code || ''
            }
          }
          
          // Extraer información de estado si está disponible
          return {
            id: asset.id,
            line: asset.code || '',
            factory: factory,
            location: asset.location || '',
            status: asset.status || 'unknown',
            oee: asset.oee || 0,
            speed: asset.speed || 0,
            throughput: asset.throughput || 0,
            production: asset.production || 0,
            influx_available: asset.influx_available || false,
            last_update: asset.last_update || asset.lastUpdate || null
          }
        })
      
      // Obtener fábrica seleccionada del estado o localStorage como fallback
      const factoryToFilter = selectedFactory || localStorage.getItem('selectedFactory')
      
      // Filtrar por fábrica si está seleccionada (excluir 'CX' que es vista global)
      let filteredLines = lines
      if (factoryToFilter && factoryToFilter !== 'CX') {
        filteredLines = lines.filter(line => {
          const lineFactory = line.factory ? line.factory.toUpperCase().trim() : ''
          const selected = factoryToFilter.toUpperCase().trim()
          return lineFactory === selected
        })
      }
      
      // Obtener estados y throughput desde InfluxDB si hay líneas y una fábrica seleccionada
      if (filteredLines.length > 0 && factoryToFilter && factoryToFilter !== 'CX') {
        await loadLinesStatus(filteredLines, factoryToFilter, true) // true = incluir throughput en carga inicial
      } else {
        // Si no hay fábrica seleccionada o es 'CX', mostrar todas las líneas (vista global)
        // Si hay fábrica seleccionada pero no hay líneas, mostrar array vacío
        setLines(filteredLines)
      }
      
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('Error loading lines:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      setError(`Error de conexión: ${err.message || 'No se pudo conectar al servidor'}`)
      setLines([])
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar el estado de las líneas desde InfluxDB
  const loadLinesStatus = async (lines, factory, includeThroughput = false) => {
    try {
      // Extraer códigos de líneas
      const lineCodes = lines.map(line => line.line).filter(code => code)
      
      if (lineCodes.length === 0) {
        setLines(lines)
        return
      }
      
      // Consultar estado desde InfluxDB
      const statusResponse = await api.get(`/asset/lines/status?factory=${factory}&lines=${lineCodes.join(',')}`)
      
      // Actualizar líneas con el estado y throughput desde InfluxDB
      const updatedLines = lines.map(line => {
        const statusInfo = statusResponse[line.line]
        if (statusInfo) {
          const newThroughput = includeThroughput ? (statusInfo.throughput || 0) : (line.throughput || 0)
          return {
            ...line,
            status: statusInfo.status === 'operativa' ? 'running' : 
                   statusInfo.status === 'apagada' ? 'stopped' : 'unknown',
            influx_available: statusInfo.status !== 'unknown',
            // Solo actualizar throughput si includeThroughput es true
            throughput: newThroughput,
            last_update: statusInfo.last_seen || line.last_update
          }
        }
        return {
          ...line,
          status: 'unknown',
          influx_available: false,
          throughput: includeThroughput ? 0 : (line.throughput || 0)
        }
      })
      
      setLines(updatedLines)
      if (includeThroughput) {
        setLastThroughputUpdate(new Date())
      }
    } catch (err) {
      console.error('Error loading lines status from InfluxDB:', err)
      // Si falla, usar las líneas sin estado actualizado
      setLines(lines)
    }
  }

  // Función para actualizar solo el estado (sin throughput)
  const loadLinesStatusOnly = async () => {
    if (lines.length === 0 || !selectedFactory) return
    
    // Asegurar que solo trabajamos con líneas de la fábrica seleccionada
    const filteredLines = lines.filter(line => {
      const lineFactory = line.factory ? line.factory.toUpperCase().trim() : ''
      const selected = selectedFactory.toUpperCase().trim()
      return lineFactory === selected
    })
    
    if (filteredLines.length === 0) return
    
    try {
      const lineCodes = filteredLines.map(line => line.line).filter(code => code)
      if (lineCodes.length === 0) return
      
      const statusResponse = await api.get(`/asset/lines/status?factory=${selectedFactory}&lines=${lineCodes.join(',')}`)
      
      const updatedLines = filteredLines.map(line => {
        const statusInfo = statusResponse[line.line]
        if (statusInfo) {
          return {
            ...line,
            status: statusInfo.status === 'operativa' ? 'running' : 
                   statusInfo.status === 'apagada' ? 'stopped' : 'unknown',
            influx_available: statusInfo.status !== 'unknown',
            // Mantener el throughput existente
            throughput: line.throughput || 0,
            last_update: statusInfo.last_seen || line.last_update
          }
        }
        return line
      })
      
      setLines(updatedLines)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading lines status:', err)
    }
  }

  // Función para actualizar solo el throughput
  const loadLinesThroughput = async () => {
    if (lines.length === 0 || !selectedFactory) return
    
    // Asegurar que solo trabajamos con líneas de la fábrica seleccionada
    const filteredLines = lines.filter(line => {
      const lineFactory = line.factory ? line.factory.toUpperCase().trim() : ''
      const selected = selectedFactory.toUpperCase().trim()
      return lineFactory === selected
    })
    
    if (filteredLines.length === 0) return
    
    try {
      const lineCodes = filteredLines.map(line => line.line).filter(code => code)
      if (lineCodes.length === 0) return
      
      const statusResponse = await api.get(`/asset/lines/status?factory=${selectedFactory}&lines=${lineCodes.join(',')}`)
      
      const updatedLines = filteredLines.map(line => {
        const statusInfo = statusResponse[line.line]
        if (statusInfo) {
          return {
            ...line,
            // Actualizar solo el throughput, mantener el resto
            throughput: statusInfo.throughput || 0,
            last_update: statusInfo.last_seen || line.last_update
          }
        }
        return line
      })
      
      setLines(updatedLines)
      setLastThroughputUpdate(new Date())
      console.log('Throughput updated at', new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Error loading lines throughput:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'operando':
        return 'success'
      case 'stopped':
      case 'detenida':
        return 'danger'
      case 'maintenance':
      case 'mantenimiento':
        return 'warning'
      case 'setup':
      case 'preparación':
        return 'info'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'operando':
        return <Activity className="text-green-500" size={20} />
      case 'stopped':
      case 'detenida':
        return <Zap className="text-red-500" size={20} />
      case 'maintenance':
      case 'mantenimiento':
        return <Clock className="text-yellow-500" size={20} />
      default:
        return <Activity className="text-gray-500" size={20} />
    }
  }

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'Operando'
      case 'stopped': return 'Detenida'
      case 'maintenance': return 'Mantenimiento'
      case 'setup': return 'Preparación'
      case 'unknown': return 'Sin datos'
      default: return status || 'Desconocido'
    }
  }

  const getFactoryFlag = (factoryCode) => {
    const flags = {
      'CXB': '🇧🇷', 'CXC': '🇨🇱', 'CXD': '🇩🇪', 'CXE': '🇪🇸',
      'CXF': '🇫🇷', 'CXM': '🇲🇽', 'EXT': '🇷🇺', 'FSP': '🇫🇷',
      'FPC': '🇫🇷', 'FPL': '🇫🇷', 'MNT': '🇮🇹', 'RTP': '🇪🇸', 'ITC': '🇮🇹'
    }
    return flags[factoryCode] || '🏭'
  }

  if (loading && lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    )
  }

  if (error && lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={loadLines}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Agrupar líneas por fábrica
  const linesByFactory = lines.reduce((acc, line) => {
    if (!acc[line.factory]) {
      acc[line.factory] = []
    }
    acc[line.factory].push(line)
    return acc
  }, {})

  const factories = Object.keys(linesByFactory).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Factory size={32} />
            {selectedFactory ? (
              <>
                {getFactoryFlag(selectedFactory)}
                Líneas de {selectedFactory}
              </>
            ) : (
              'Líneas de Producción'
            )}
          </h1>
          <p className="text-gray-400 mt-2">
            Estado en tiempo real de {lines.length} {lines.length === 1 ? 'línea' : 'líneas'} de producción
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadLines}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-white flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Líneas</p>
                <p className="text-2xl font-bold text-white">{lines.length}</p>
              </div>
              <Factory className="text-blue-500" size={32} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Operando</p>
                <p className="text-2xl font-bold text-green-500">
                  {lines.filter(l => l.status?.toLowerCase() === 'running').length}
                </p>
              </div>
              <Activity className="text-green-500" size={32} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Detenidas</p>
                <p className="text-2xl font-bold text-red-500">
                  {lines.filter(l => l.status?.toLowerCase() === 'stopped').length}
                </p>
              </div>
              <Zap className="text-red-500" size={32} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Con Datos</p>
                <p className="text-2xl font-bold text-blue-500">
                  {lines.filter(l => l.influx_available).length}
                </p>
              </div>
              <TrendingUp className="text-blue-500" size={32} />
            </div>
          </div>
        </Card>
      </div>

      {/* Líneas - Vista por Fábrica Específica */}
      {selectedFactory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lines.map(line => (
            <Card key={line.id} className="hover:border-blue-500 transition-all">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(line.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {line.line}
                      </h3>
                      <p className="text-xs text-gray-500">{line.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(line.status)}>
                      {getStatusText(line.status)}
                    </Badge>
                  </div>
                </div>

                {/* Métricas */}
                {line.influx_available ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">OEE</span>
                      <span className={`font-semibold ${
                        line.oee >= 85 ? 'text-green-500' :
                        line.oee >= 70 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {line.oee?.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Throughput</span>
                      <span className="font-mono text-white">
                        {typeof line.throughput === 'number' && !isNaN(line.throughput) 
                          ? line.throughput.toFixed(1) 
                          : (typeof line.speed === 'number' && !isNaN(line.speed) 
                            ? line.speed.toFixed(1) 
                            : '0.0')} kg/h
                      </span>
                    </div>

                    {line.production > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Producción</span>
                        <span className="font-mono text-white">
                          {line.production?.toFixed(0)} m
                        </span>
                      </div>
                    )}

                    {line.last_update && (
                      <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-700">
                        {new Date(line.last_update).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 py-4">
                    <p className="text-xs">Sin conexión InfluxDB</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Vista General - Agrupada por Fábrica */
        <>
          {factories.map(factory => (
            <div key={factory}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>{getFactoryFlag(factory)}</span>
                  <span>{factory}</span>
                  <span className="text-sm text-gray-500">
                    ({linesByFactory[factory].length} {linesByFactory[factory].length === 1 ? 'línea' : 'líneas'})
                  </span>
                </h2>
                
                {/* Solo usuarios con acceso a CX pueden ver todas las fábricas */}
                {permissions && checkFactoryAccess('CX') && (
                  <button
                    onClick={() => {
                      localStorage.setItem('selectedFactory', factory)
                      window.dispatchEvent(new CustomEvent('factoryChanged', { 
                        detail: { factory } 
                      }))
                      loadLines()
                    }}
                    className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    Ver todas las líneas de {factory}
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {linesByFactory[factory].map(line => (
                  <Card key={line.id} className="hover:border-blue-500 transition-all">
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(line.status)}
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {line.line}
                            </h3>
                            <p className="text-xs text-gray-500">{line.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(line.status)}>
                          {getStatusText(line.status)}
                        </Badge>
                      </div>
                      </div>

                      {/* Métricas */}
                      {line.influx_available ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">OEE</span>
                            <span className={`font-semibold ${
                              line.oee >= 85 ? 'text-green-500' :
                              line.oee >= 70 ? 'text-yellow-500' :
                              'text-red-500'
                            }`}>
                              {line.oee?.toFixed(1)}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Throughput</span>
                            <span className="font-mono text-white">
                              {typeof line.throughput === 'number' && !isNaN(line.throughput) 
                                ? line.throughput.toFixed(1) 
                                : (typeof line.speed === 'number' && !isNaN(line.speed) 
                                  ? line.speed.toFixed(1) 
                                  : '0.0')} kg/h
                            </span>
                          </div>

                          {line.production > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Producción</span>
                              <span className="font-mono text-white">
                                {line.production?.toFixed(0)} m
                              </span>
                            </div>
                          )}

                          {line.last_update && (
                            <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-700">
                              {new Date(line.last_update).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-600 py-4">
                          <p className="text-xs">Sin conexión InfluxDB</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {lines.length === 0 && !loading && (
        <Card>
          <div className="p-12 text-center text-gray-500">
            <Factory size={48} className="mx-auto mb-4 opacity-50" />
            <p>No se encontraron líneas de producción</p>
          </div>
        </Card>
      )}

    </div>
  )
}

export default ProductionLineas

