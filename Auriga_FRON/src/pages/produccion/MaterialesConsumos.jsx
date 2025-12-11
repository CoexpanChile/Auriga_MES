import React, { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Factory, Package, RefreshCw, Loader2, ChevronRight, Home, Trash2, AlertCircle, CheckCircle2, X, Edit, Settings, Plus, PlayCircle, Square, Calculator } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { api } from '../../lib/api'
import { useLanguage } from '../../context/LanguageContext'

// Importar hooks y componentes refactorizados
import { useNotifications } from './MaterialesConsumos/hooks'
import { Notifications } from './MaterialesConsumos/components/shared/Notifications'
import { LoadingState, EmptyState } from './MaterialesConsumos/components/shared/LoadingState'
import { PageHeader } from './MaterialesConsumos/components/shared/PageHeader'
import { EditConsumptionModal } from './MaterialesConsumos/components/shared/EditConsumptionModal'
import { DosifierManagerModal } from './MaterialesConsumos/components/shared/DosifierManagerModal'
import { HopperManagerModal } from './MaterialesConsumos/components/shared/HopperManagerModal'
import { ComponentManagerModal } from './MaterialesConsumos/components/shared/ComponentManagerModal'
import LineCard from './MaterialesConsumos/components/LineSelector/LineCard'

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
// LineCard ahora se importa desde archivos separados (optimizado)

function MaterialsConsumablesPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  // Hook de notificaciones refactorizado
  const { error, success, showError, showSuccess, clearError, clearSuccess } = useNotifications()

  // Estado para la fábrica seleccionada (reactivo a cambios)
  const [selectedFactory, setSelectedFactory] = useState(() => {
    const saved = localStorage.getItem('selectedFactory')
    return saved && saved !== 'CX' ? saved : null
  })

  const isGlobalView = !selectedFactory

  // Silenciar errores de extensiones del navegador (no afectan la funcionalidad)
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
      
      // También verificar si es un string directamente
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

  // Escuchar cambios en localStorage y eventos personalizados
  useEffect(() => {
    const checkAndUpdateFactory = () => {
      const saved = localStorage.getItem('selectedFactory')
      const newFactory = saved && saved !== 'CX' ? saved : null
      
      // Usar una función de actualización para evitar dependencias
      setSelectedFactory(prevFactory => {
        if (newFactory !== prevFactory) {
          debug.log('🏭 Cambio de fábrica detectado:', { old: prevFactory, new: newFactory })
          // Limpiar selecciones cuando cambia la fábrica (usar setTimeout para evitar problemas de estado)
          setTimeout(() => {
            setSelectedLine(null)
            setSelectedOrder(null)
            setOrders([])
            setRecipe(null)
            setConsumptions([])
          }, 0)
          return newFactory
        }
        return prevFactory
      })
    }

    // Verificar inmediatamente
    checkAndUpdateFactory()

    // Escuchar eventos de storage (cuando cambia en otra pestaña/ventana)
    const handleStorageChange = (e) => {
      if (e.key === 'selectedFactory') {
        checkAndUpdateFactory()
      }
    }

    // Escuchar eventos personalizados (cuando cambia en la misma pestaña)
    const handleFactoryChange = (event) => {
      checkAndUpdateFactory()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('factoryChanged', handleFactoryChange)

    // Polling cada 1 segundo para detectar cambios (fallback)
    const interval = setInterval(checkAndUpdateFactory, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('factoryChanged', handleFactoryChange)
      clearInterval(interval)
    }
  }, []) // Sin dependencias para evitar loops


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
  const [sendingToSAP, setSendingToSAP] = useState(false)
  const [loadingRecipe, setLoadingRecipe] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [addingConsumption, setAddingConsumption] = useState(false)
  const [updatingSAP, setUpdatingSAP] = useState(false)
  const [loadingLineData, setLoadingLineData] = useState(false)
  
  // Estados para declaración de consumo
  const [dosifiersFromAPI, setDosifiersFromAPI] = useState([])
  const [hoppersFromAPI, setHoppersFromAPI] = useState([])
  const [loadingDosifiersAPI, setLoadingDosifiersAPI] = useState(false)
  const [declarationForm, setDeclarationForm] = useState({
    componentSapCode: '',
    dosifierId: '',
    hopperId: ''
  })
  
  // Estados para Inicio y Fin de OF
  const [ofStartDateTime, setOfStartDateTime] = useState(null) // Formato: Date object
  const [ofEndDateTime, setOfEndDateTime] = useState(null) // Formato: Date object
  const [showStartModal, setShowStartModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [tempStartDateTime, setTempStartDateTime] = useState('')
  const [tempEndDateTime, setTempEndDateTime] = useState('')
  
  // Estados para modales de gestión CRUD
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingConsumption, setEditingConsumption] = useState(null)
  const [showDosifierModal, setShowDosifierModal] = useState(false)
  const [showHopperModal, setShowHopperModal] = useState(false)
  const [showComponentModal, setShowComponentModal] = useState(false)
  const [dosifiers, setDosifiers] = useState([])
  const [hoppers, setHoppers] = useState([])
  const [components, setComponents] = useState([])
  const [managingCRUD, setManagingCRUD] = useState(false)

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
    }
  }, [selectedLine])

  useEffect(() => {
    if (selectedOrder && selectedLine) {
      loadRecipe()
      loadConsumptions()
    }
  }, [selectedOrder, selectedLine])


  // Helper para normalizar la fábrica de una línea
  // Prioriza factory directamente, luego hierarchical_level[0] que contiene la fábrica (ej: 'CXC')
  // NO usa location directamente porque puede ser 'CXC_L01' (ubicación completa)
  const getFactoryFromLine = (line) => {
    // Priorizar factory si está disponible (ya fue asignada desde ParentID)
    if (line?.factory) {
      return line.factory
    }
    // Fallback a hierarchical_level[0]
    if (line?.hierarchical_level?.[0]) {
      return line.hierarchical_level[0]
    }
    // Si no hay nada, retornar string vacío
    return ''
  }

  const loadLines = async () => {
    try {
      setLoading(true)
      debug.log('🔄 Cargando líneas - Vista Tabla Completa')
      debug.log('📍 Factory seleccionada:', selectedFactory, 'isGlobalView:', isGlobalView)
      
      // Usar /asset/list y filtrar en el cliente (evita CORS y 404)
      const assets = await api.get('/asset/list')
      
      debug.log('📦 Assets recibidos de la API:', assets?.length || 0)
      if (assets && assets.length > 0 && isDev) {
        // Mostrar algunos ejemplos de assets completos para debugging
        debug.log('📋 Ejemplos de assets completos (primeros 3):', assets.slice(0, 3))
        
        // Mostrar todas las propiedades únicas de los primeros assets
        const allKeys = new Set()
        assets.slice(0, 10).forEach(a => {
          Object.keys(a).forEach(key => allKeys.add(key))
        })
        debug.log('🔑 Propiedades encontradas en assets:', Array.from(allKeys).sort())
      }
      
      // Encontrar el ID de la fábrica seleccionada si existe
      let selectedFactoryId = null
      if (selectedFactory) {
        const factoryAsset = (assets || []).find(a => 
          (a.Code === selectedFactory || a.code === selectedFactory) && 
          (a.ParentID === null || a.parentID === null)
        )
        if (factoryAsset) {
          selectedFactoryId = factoryAsset.ID || factoryAsset.id
          debug.log('🏭 Fábrica seleccionada encontrada:', {
            code: factoryAsset.Code || factoryAsset.code,
            id: selectedFactoryId
          })
        } else {
          debug.warn('⚠️ No se encontró la fábrica seleccionada:', selectedFactory)
        }
      }
      
      // Filtrar solo líneas de producción
      // Estructura: Code empieza con 'Line_' o 'L', y tiene ParentID que apunta a una fábrica
      // O tiene hierarchical_level con 2 elementos (fábrica + línea)
      let linesData = (assets || []).filter(asset => {
        const code = asset.Code || asset.code || ''
        const parentId = asset.ParentID || asset.parentID
        const hierarchicalLevel = asset.hierarchical_level || asset.HierarchicalLevel
        
        // Verificar si es una línea por código
        const isLineByCode = code && (
          code.startsWith('Line_') || 
          code.startsWith('L') ||
          code.toLowerCase().includes('line') ||
          code.match(/^Line_\d+/i) || // Line_01, Line_02, etc.
          code.match(/^L\d+/i) // L01, L02, etc.
        )
        
        // Verificar si es una línea por hierarchical_level (nivel 2 = fábrica + línea)
        const isLineByLevel = hierarchicalLevel && Array.isArray(hierarchicalLevel) && hierarchicalLevel.length === 2
        
        // Debe tener un ParentID (no es null, es decir, pertenece a una fábrica)
        const hasParent = parentId !== null && parentId !== undefined
        
        const isLine = isLineByCode || isLineByLevel
        
        return isLine && hasParent
      })
      
      debug.log('🔍 Líneas encontradas después del filtro inicial:', linesData.length)
      
      // Filtrar por fábrica si se especifica
      if (selectedFactoryId !== null) {
        debug.log('🔍 Filtrando líneas por fábrica ID:', selectedFactoryId)
        const beforeFilter = linesData.length
        linesData = linesData.filter(line => {
          const lineParentId = line.ParentID || line.parentID
          const matchesFactory = lineParentId === selectedFactoryId
          
          if (!matchesFactory && isDev) {
            debug.log('❌ Línea no coincide con fábrica:', {
              lineCode: line.Code || line.code,
              lineParentId: lineParentId,
              selectedFactoryId: selectedFactoryId
            })
          }
          
          return matchesFactory
        })
        debug.log(`📊 Filtrado: ${beforeFilter} líneas antes, ${linesData.length} después del filtro por fábrica ${selectedFactory}`)
      }
      
      debug.log('📦 Assets totales:', assets?.length || 0)
      debug.log('📦 Líneas filtradas (nivel 1):', linesData.length)
      
      // Si no hay líneas con el filtro estricto, intentar un filtro más permisivo
      if (linesData.length === 0 && assets && assets.length > 0) {
        debug.warn('⚠️ No se encontraron líneas con el filtro estricto, intentando filtro más permisivo...')
        
        // Filtro más permisivo: cualquier asset con ParentID y hierarchical_level de 2 elementos
        const fallbackLines = (assets || []).filter(asset => {
          const parentId = asset.ParentID || asset.parentID
          const hierarchicalLevel = asset.hierarchical_level || asset.HierarchicalLevel
          
          // Si tiene ParentID y no es la fábrica misma (que tiene ParentID null)
          const hasParent = parentId !== null && parentId !== undefined
          
          // Si tiene hierarchical_level con 2 elementos, probablemente es una línea
          const hasTwoLevels = hierarchicalLevel && Array.isArray(hierarchicalLevel) && hierarchicalLevel.length === 2
          
          return hasParent && hasTwoLevels
        })
        
        if (fallbackLines.length > 0) {
          debug.warn(`✅ Encontradas ${fallbackLines.length} líneas con filtro permisivo`)
          linesData = fallbackLines
        } else {
          debug.warn('⚠️ No se encontraron líneas ni con el filtro permisivo')
          // Mostrar algunos assets con ParentID para entender la estructura
          const assetsWithParent = assets.filter(a => (a.ParentID || a.parentID) !== null && (a.ParentID || a.parentID) !== undefined)
          if (assetsWithParent.length > 0) {
            debug.warn('📋 Assets con ParentID (primeros 10):', assetsWithParent.slice(0, 10).map(a => ({
              code: a.Code || a.code,
              name: a.Name || a.name,
              parentId: a.ParentID || a.parentID,
              hierarchical_level: a.hierarchical_level || a.HierarchicalLevel,
              allKeys: Object.keys(a).slice(0, 10)
            })))
          }
        }
      }
      
      debug.log('✅ Líneas cargadas:', linesData.length, 'líneas')
      
      if (linesData.length === 0 && assets && assets.length > 0) {
        debug.warn('⚠️ No se encontraron líneas. Analizando estructura de assets:')
        
        // Analizar diferentes estructuras de hierarchical_level
        const level1Assets = assets.filter(a => a.hierarchical_level && a.hierarchical_level.length === 1)
        const level2Assets = assets.filter(a => a.hierarchical_level && a.hierarchical_level.length === 2)
        const level3Assets = assets.filter(a => a.hierarchical_level && a.hierarchical_level.length === 3)
        const otherAssets = assets.filter(a => !a.hierarchical_level || (a.hierarchical_level.length !== 1 && a.hierarchical_level.length !== 2 && a.hierarchical_level.length !== 3))
        
        debug.warn('📊 Análisis de assets:')
        debug.warn(`  - Assets con 1 nivel: ${level1Assets.length}`)
        debug.warn(`  - Assets con 2 niveles: ${level2Assets.length}`)
        debug.warn(`  - Assets con 3 niveles: ${level3Assets.length}`)
        debug.warn(`  - Otros assets: ${otherAssets.length}`)
        
        // Mostrar ejemplos de assets con 1 nivel
        if (level1Assets.length > 0) {
          debug.warn('📋 Ejemplos de assets con 1 nivel (primeros 10):', level1Assets.slice(0, 10).map(a => ({
            code: a.code,
            name: a.name,
            hierarchical_level: a.hierarchical_level,
            firstLevel: a.hierarchical_level?.[0],
            location: a.location,
            factory: a.factory
          })))
        }
        
        // Mostrar ejemplos completos de algunos "otros assets" para entender su estructura
        if (otherAssets.length > 0) {
          debug.warn('📋 Ejemplos de "otros assets" (primeros 5 completos):', otherAssets.slice(0, 5))
        }
        
        // Buscar assets que contengan "CXC" en alguna propiedad
        const cxcAssets = assets.filter(a => {
          const code = String(a.code || '').toUpperCase()
          const name = String(a.name || '').toUpperCase()
          const location = String(a.location || '').toUpperCase()
          const factory = String(a.factory || '').toUpperCase()
          return code.includes('CXC') || name.includes('CXC') || location.includes('CXC') || factory.includes('CXC')
        })
        if (cxcAssets.length > 0) {
          debug.warn(`📋 Assets relacionados con CXC (${cxcAssets.length}):`, cxcAssets.slice(0, 10).map(a => ({
            code: a.code,
            name: a.name,
            hierarchical_level: a.hierarchical_level,
            location: a.location,
            factory: a.factory,
            allProperties: Object.keys(a)
          })))
        }
        
        // Buscar assets que puedan ser líneas (contienen "line" o "L" en alguna propiedad)
        const potentialLines = assets.filter(a => {
          const code = String(a.code || '').toLowerCase()
          const name = String(a.name || '').toLowerCase()
          const location = String(a.location || '').toLowerCase()
          return code.includes('line') || code.match(/^l\d+/) || name.includes('line') || location.includes('line')
        })
        if (potentialLines.length > 0) {
          debug.warn(`📋 Assets que podrían ser líneas (${potentialLines.length}):`, potentialLines.slice(0, 10).map(a => ({
            code: a.code,
            name: a.name,
            hierarchical_level: a.hierarchical_level,
            location: a.location,
            factory: a.factory
          })))
        }
      } else if (linesData.length > 0) {
        debug.log('📊 Datos de líneas:', linesData.map(l => ({
          code: l.Code || l.code,
          id: l.ID || l.id,
          parentId: l.ParentID || l.parentID,
          factory: selectedFactory
        })))
      }
      
      // Mapear las líneas a un formato consistente
      // Buscar la fábrica usando el ParentID de cada línea
      const mappedLines = linesData.map(line => {
        const parentId = line.ParentID || line.parentID
        const lineCode = line.Code || line.code || ''
        
        // Buscar el asset padre (fábrica) usando el ParentID
        let factoryCode = selectedFactory || ''
        if (parentId !== null && parentId !== undefined && assets) {
          const parentAsset = assets.find(a => (a.ID || a.id) === parentId)
          if (parentAsset) {
            factoryCode = parentAsset.Code || parentAsset.code || selectedFactory || ''
            debug.log(`🏭 Fábrica encontrada para línea ${lineCode}:`, factoryCode, 'desde ParentID:', parentId)
          } else {
            debug.warn(`⚠️ No se encontró asset padre para línea ${lineCode} con ParentID:`, parentId)
          }
        } else {
          debug.warn(`⚠️ Línea ${lineCode} no tiene ParentID válido:`, parentId)
        }
        
        // Asegurar que siempre haya una fábrica asignada
        if (!factoryCode) {
          factoryCode = selectedFactory || ''
          debug.warn(`⚠️ Usando selectedFactory como fallback para línea ${lineCode}:`, factoryCode)
        }
        
        return {
          ...line,
          code: lineCode,
          id: line.ID || line.id || `line-${lineCode}`, // Asegurar que siempre haya un id único
          parentId: parentId,
          factory: factoryCode, // Siempre asignar una fábrica (nunca null/undefined)
          line: lineCode,
          // Mantener compatibilidad con código existente
          hierarchical_level: line.hierarchical_level || [factoryCode, lineCode]
        }
      })
      
      debug.log('📝 Líneas mapeadas finales:', mappedLines.length)
      if (mappedLines.length > 0) {
        debug.log('📋 Primeras 3 líneas mapeadas:', mappedLines.slice(0, 3).map(l => ({
          id: l.id,
          code: l.code,
          factory: l.factory,
          parentId: l.parentId
        })))
      }
      
      setLines(mappedLines)
      clearError()
    } catch (err) {
      debug.error('❌ Error loading lines:', err)
      showError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const loadLinesWithData = async () => {
    if (lines.length === 0) {
      debug.log('⚠️ No hay líneas para cargar datos')
      setLinesWithData([])
      setLoadingLineData(false)
      return
    }
    
    try {
      setLoadingLineData(true)
      // Limitar a las primeras 10 líneas para mejorar rendimiento inicial
      const linesToLoad = lines.slice(0, 10)
      debug.log('🔄 Cargando datos completos para', linesToLoad.length, 'líneas (de', lines.length, 'totales)')
      
      const linesData = await Promise.all(
        linesToLoad.map(async (line) => {
          try {
            // Normalizar propiedades de línea con fallbacks robustos
            let factory = getFactoryFromLine(line)
            // Si aún no hay factory, usar selectedFactory como último recurso
            if (!factory && selectedFactory) {
              factory = selectedFactory
              debug.warn(`⚠️ Usando selectedFactory como fallback para línea ${line.code || line.line}:`, factory)
            }
            
            const prodLine = line.line || line.code || ''
            const sapCode = line.sap_code || line.code || line.line || ''
            
            if (!factory) {
              debug.error(`⚠️ No se pudo determinar la fábrica para línea:`, { 
                hierarchical_level: line.hierarchical_level, 
                factory: line.factory, 
                location: line.location,
                selectedFactory,
                line 
              })
            }
            
            debug.log(`🔄 Cargando datos para línea:`, { factory, prodLine, sapCode, location: line.location, hierarchical_level: line.hierarchical_level })
            
            if (!factory || !prodLine) {
              debug.error(`⚠️ Línea sin factory o prodLine:`, { factory, prodLine, line, selectedFactory })
              return {
                ...line,
                orders: [],
                activeOrder: null,
                recipe: null
              }
            }
            
            // Cargar órdenes para esta línea
            // Intentar sin SapRequest header primero para evitar CORS issues
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
              // Si falla por CORS, intentar con el header (aunque probablemente también falle)
              debug.warn('⚠️ Error en primera llamada, reintentando con SapRequest header:', corsError.message)
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
                // Si aún falla, lanzar el error original
                throw corsError
              }
            }
            
            const ordersData = Array.isArray(ordersResponse) ? ordersResponse : []
            debug.log(`✅ Órdenes cargadas para ${prodLine}:`, ordersData.length)
            
            // Buscar orden activa (Started pero no Finished)
            const activeOrder = ordersData.find(order => 
              order.StarteddAt && !order.FinishedAt
            ) || ordersData[0] // Si no hay activa, tomar la primera
            
            let recipeData = null
            if (activeOrder) {
              try {
                debug.log(`🔄 Cargando receta para línea ${prodLine}, orden ${activeOrder.OrderNumber}`)
                // Cargar receta para la orden activa desde SAP
                const recipeResponse = await api.get('/sap/orderRecipe', {
                  headers: {
                    'Content-Type': 'application/json',
                    'Factory': factory,
                    'ProdLine': prodLine,
                    'SapOrderCode': activeOrder.OrderNumber,
                    'SapRequest': 'true' // Cargar desde SAP
                  }
                })
                recipeData = recipeResponse || null
                debug.log(`✅ Receta cargada para ${prodLine}:`, recipeData ? `${recipeData.Components?.length || 0} componentes` : 'sin datos')
              } catch (recipeErr) {
                debug.error(`❌ Error cargando receta para ${prodLine}:`, recipeErr.response?.data || recipeErr.message)
              }
            } else {
              debug.log(`⚠️ Línea ${prodLine} no tiene orden activa`)
            }
            
            return {
              ...line,
              orders: ordersData,
              activeOrder: activeOrder,
              recipe: recipeData
            }
          } catch (err) {
            debug.error(`❌ Error cargando datos para línea:`, err)
            // Retornar la línea básica sin datos completos, pero aún así mostrarla
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
      
      debug.log('✅ Datos completos cargados:', linesData.length, 'líneas')
      // Filtrar líneas válidas (que tengan al menos un id o code)
      const validLines = linesData.filter(line => line.id || line.code)
      setLinesWithData(validLines)
      
      if (validLines.length === 0 && lines.length > 0) {
        debug.warn('⚠️ No se pudieron cargar datos para ninguna línea, pero hay', lines.length, 'líneas disponibles')
      }
    } catch (err) {
      debug.error('Error loading lines with data:', err)
      // No mostrar error crítico, solo loguear
      // Las líneas básicas se mostrarán de todas formas
      debug.warn('⚠️ Error al cargar datos completos, pero se mostrarán las líneas básicas')
    } finally {
      setLoadingLineData(false)
    }
  }

  const loadOrders = async (fromSAP = false) => {
    if (!selectedLine) {
      debug.log('⚠️ No selectedLine, retornando de loadOrders')
      return
    }
    
    try {
      setLoadingOrders(true)
      setUpdatingSAP(fromSAP)
      
      // Normalizar propiedades de selectedLine con fallbacks robustos
      let factory = getFactoryFromLine(selectedLine)
      // Si aún no hay factory, usar selectedFactory como último recurso
      if (!factory && selectedFactory) {
        factory = selectedFactory
        debug.warn(`⚠️ Usando selectedFactory como fallback en loadOrders:`, factory)
      }
      const prodLine = selectedLine.line || selectedLine.code || ''
      const sapCode = selectedLine.sap_code || selectedLine.code || selectedLine.line || ''
      
      if (!factory || !prodLine) {
        debug.error(`⚠️ No se puede cargar órdenes: falta factory o prodLine:`, { factory, prodLine, selectedLine, selectedFactory })
        showError('No se pudo determinar la fábrica o línea de producción')
        return
      }
      
      debug.log('🔄 Cargando órdenes para:', { factory, prodLine, sapCode, location: selectedLine.location, hierarchical_level: selectedLine.hierarchical_level })
      
      const headers = {
        'Content-Type': 'application/json',
        'Factory': factory,
        'ProdLine': prodLine,
        'SapCode': sapCode,
        'SapRequest': fromSAP ? 'true' : 'false'
      }
      
      const response = await api.post('/sap/orders', {}, {
        headers: headers,
        
      })
      
      const ordersData = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : [])
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

  const loadRecipe = async (fromSAP = false) => {
    if (!selectedOrder || !selectedLine) {
      debug.log('⚠️ No selectedOrder o selectedLine, retornando de loadRecipe')
      return
    }
    
    try {
      setLoadingRecipe(true)
      
      // Normalizar propiedades de selectedLine con fallbacks robustos
      let factory = getFactoryFromLine(selectedLine)
      // Si aún no hay factory, usar selectedFactory como último recurso
      if (!factory && selectedFactory) {
        factory = selectedFactory
        debug.warn(`⚠️ Usando selectedFactory como fallback en loadRecipe:`, factory)
      }
      const prodLine = selectedLine.line || selectedLine.code || ''
      
      if (!factory || !prodLine) {
        debug.error(`⚠️ No se puede cargar receta: falta factory o prodLine:`, { factory, prodLine, selectedLine, selectedFactory })
        showError('No se pudo determinar la fábrica o línea de producción')
        return
      }
      
      debug.log('🔄 Cargando receta para:', { orderNumber: selectedOrder.OrderNumber, factory, prodLine })
      
      const headers = {
        'Content-Type': 'application/json',
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapRequest': fromSAP ? 'true' : 'false',
        'Factory': factory,
        'ProdLine': prodLine
      }
      
      const response = await api.get('/sap/orderRecipe', {
        headers: headers,
        
      })
      
      const recipeData = response || null
      debug.log('✅ Receta cargada:', recipeData)
      setRecipe(recipeData)
      if (fromSAP && recipeData) {
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
    if (!selectedOrder || !selectedLine) {
      debug.log('⚠️ No selectedOrder o selectedLine, retornando de loadConsumptions')
      return
    }
    
    try {
      setLoadingConsumptions(true)
      clearError()
      
      // Normalizar propiedades de selectedLine
      const factory = getFactoryFromLine(selectedLine)
      const prodLine = selectedLine.line || selectedLine.code || ''
      
      debug.log('🔄 Cargando consumos para:', { orderNumber: selectedOrder.OrderNumber, factory, prodLine })
      
      const headers = {
        'Content-Type': 'application/json',
        'Factory': factory,
        'ProdLine': prodLine,
        'System': '', // Puede estar vacío según el handler
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapRequest': 'false'
      }
      
      const response = await api.get('/sap/orderConsump/list', {
        headers: headers,
        
      })
      
      const consumptionsData = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : [])
      // Filtrar entradas vacías si el backend retorna un array con un elemento vacío
      const filteredConsumptions = consumptionsData.filter(c => 
        c.ComponentSapCode && c.ComponentSapCode.trim() !== ''
      )
      
      setConsumptions(filteredConsumptions)
      setLastUpdate(new Date())
    } catch (err) {
      debug.error('Error loading consumptions:', err)
      // Si el endpoint no existe (404) o no está implementado, usar array vacío
      if (err.status === 404 || err.message?.includes('Not Found') || err.message?.includes('404')) {
        debug.warn('⚠️ Endpoint /sap/orderConsump/list no disponible, usando array vacío')
        setConsumptions([])
        setLastUpdate(new Date())
        return
      }
      if (err.response?.status === 403) {
        showError('No tienes permisos para acceder a los consumos')
      } else {
        showError('Error al cargar los consumos de materiales')
      }
    } finally {
      setLoadingConsumptions(false)
    }
  }


  // Función para calcular consumos desde InfluxDB
  const handleCalculateConsumptions = async () => {
    if (!selectedOrder || !selectedLine) {
      showError('Selecciona una orden y línea primero')
      return
    }
    
    try {
      setLoadingConsumptions(true)
      clearError()
      
      const factory = selectedLine.factory || getFactoryFromLine(selectedLine)
      const prodLine = selectedLine.line || selectedLine.code || ''
      
      if (!factory || !prodLine) {
        showError('Error: Faltan datos requeridos (factory o prodLine)')
        return
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Factory': factory,
        'ProdLine': prodLine,
        'SapOrderCode': selectedOrder.OrderNumber.trim()
      }
      
      // Si hay fechas de inicio y fin de OF, enviarlas en los headers
      if (ofStartDateTime && ofEndDateTime) {
        const startDateISO = new Date(ofStartDateTime).toISOString()
        const endDateISO = new Date(ofEndDateTime).toISOString()
        headers['StartDate'] = startDateISO
        headers['EndDate'] = endDateISO
        
        debug.log('📅 Usando fechas de Inicio/Fin OF:', {
          startDate: startDateISO,
          endDate: endDateISO
        })
      } else {
        debug.log('⚠️ No hay fechas de Inicio/Fin OF, el backend las obtendrá de la BD')
      }
      
      debug.log('🔄 Calculando consumos desde InfluxDB:', {
        factory,
        prodLine,
        orderNumber: selectedOrder.OrderNumber,
        hasDates: !!(ofStartDateTime && ofEndDateTime),
        headers
      })
      
      const response = await api.get('/sap/orderConsump/Calculate', {
        headers: headers,
      })
      
      const consumptionsData = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : [])
      const filteredConsumptions = consumptionsData.filter(c => 
        c.ComponentSapCode && c.ComponentSapCode.trim() !== ''
      )
      
      debug.log('✅ Consumos calculados desde InfluxDB:', {
        total: filteredConsumptions.length,
        consumptions: filteredConsumptions
      })
      
      // Actualizar el estado de consumos con los datos calculados
      setConsumptions(filteredConsumptions)
      
      // Recargar la receta para actualizar las cantidades declaradas
      await loadRecipe(true)
      
      showSuccess(`Consumos calculados exitosamente: ${filteredConsumptions.length} declaraciones encontradas`)
      setLastUpdate(new Date())
    } catch (err) {
      debug.error('Error calculating consumptions:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Error al calcular los consumos desde InfluxDB'
      showError(errorMessage)
    } finally {
      setLoadingConsumptions(false)
    }
  }

  // Función para enviar consumos a SAP
  const handleSendToSAP = async () => {
    if (!selectedOrder || !selectedLine) {
      showError('Selecciona una orden y línea primero')
      return
    }

    if (!consumptions || consumptions.length === 0) {
      showError('No hay consumos para enviar a SAP. Primero calcula los consumos.')
      return
    }

    if (!ofStartDateTime || !ofEndDateTime) {
      showError('Las fechas de Inicio OF y Fin OF deben estar configuradas antes de enviar a SAP')
      return
    }

    try {
      setSendingToSAP(true)
      clearError()

      const factory = selectedLine.factory || getFactoryFromLine(selectedLine)
      const prodLine = selectedLine.line || selectedLine.code || ''

      if (!factory || !prodLine) {
        showError('Error: Faltan datos requeridos (factory o prodLine)')
        return
      }

      const headers = {
        'Content-Type': 'application/json',
        'Factory': factory,
        'ProdLine': prodLine,
        'SapOrderCode': selectedOrder.OrderNumber.trim(),
        'StartDate': new Date(ofStartDateTime).toISOString(),
        'EndDate': new Date(ofEndDateTime).toISOString(),
        'WorkdayID': '', // Se puede obtener del usuario actual si está disponible
        'Turno': 'T1' // Valor por defecto, se puede hacer configurable
      }

      debug.log('📤 Enviando consumos a SAP:', {
        factory,
        prodLine,
        orderNumber: selectedOrder.OrderNumber,
        consumptionsCount: consumptions.length,
        headers
      })

      const response = await api.get('/sap/orderConsump/CalcToSAP', {
        headers: headers,
      })

      debug.log('✅ Respuesta de SAP:', response)

      showSuccess(`Consumos enviados exitosamente a SAP: ${consumptions.length} declaraciones`)
      setLastUpdate(new Date())
    } catch (err) {
      debug.error('Error sending to SAP:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Error al enviar consumos a SAP'
      showError(errorMessage)
    } finally {
      setSendingToSAP(false)
    }
  }

  // Función para editar consumo
  const handleDeleteConsumption = async (consumption) => {
    if (!selectedOrder || !selectedLine) return
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la declaración de ${consumption.ComponentSapCode || 'este componente'}?`)) {
      return
    }
    
    try {
      setAddingConsumption(true)
      clearError()
      
      const deleteHeaders = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory || getFactoryFromLine(selectedLine),
        'ProdLine': selectedLine.line || selectedLine.code,
        'System': '',
        'Machine': consumption.DosingUnit || '',
        'Part': consumption.DosingHopper || '',
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapComponentCode': consumption.ComponentSapCode || ''
      }
      
      await api.get('/sap/orderConsump/del', {
        headers: deleteHeaders,
      })
      
      // Recargar consumos después de eliminar
      await loadConsumptions()
      await loadRecipe(true)
      
      
      showSuccess('Declaración eliminada exitosamente')
    } catch (err) {
      debug.error('Error deleting consumption:', err)
      const errorMessage = err.response?.data?.message || 'Error al eliminar la declaración'
      showError(errorMessage)
    } finally {
      setAddingConsumption(false)
    }
  }

  const handleEditConsumption = async (formData, originalConsumption) => {
    if (!selectedOrder || !selectedLine) return
    
    try {
      setAddingConsumption(true)
      clearError()
      
      // Primero eliminar el consumo original
      const deleteHeaders = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'System': '',
        'Machine': originalConsumption.DosingUnit,
        'Part': originalConsumption.DosingHopper,
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapComponentCode': originalConsumption.ComponentSapCode
      }
      
      await api.get('/sap/orderConsump/del', {
        headers: deleteHeaders,
      })
      
      // Luego agregar el consumo con los nuevos datos
      const addHeaders = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'System': '',
        'Machine': formData.DosingUnit.trim(),
        'Part': formData.DosingHopper.trim(),
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapComponentCode': formData.ComponentSapCode.trim()
      }
      
      await api.get('/sap/orderConsump/add', {
        headers: addHeaders,
      })
      
      // Cerrar modal
      setShowEditModal(false)
      setEditingConsumption(null)
      
      // Recargar consumos después de editar
      await loadConsumptions()
      await loadRecipe(true)
      showSuccess('Consumo editado exitosamente')
    } catch (err) {
      debug.error('Error editing consumption:', err)
      const errorMessage = err.response?.data?.message || 'Error al editar el consumo'
      showError(errorMessage)
    } finally {
      setAddingConsumption(false)
    }
  }

  // Función para cargar dosificadores y hoppers desde la API
  const loadDosifiersAndHoppersFromAPI = useCallback(async () => {
    if (!selectedLine || !selectedOrder) {
      return
    }

    try {
      setLoadingDosifiersAPI(true)
      clearError()

      // Obtener el ID de la línea (puede ser code, id, o line)
      // Intentar diferentes propiedades para obtener el ID
      const prodLineId = selectedLine.id || 
                        selectedLine.ID || 
                        selectedLine.code || 
                        selectedLine.Code || 
                        selectedLine.line || 
                        selectedLine.Line ||
                        selectedLine.sap_code ||
                        ''
      const orderNumber = selectedOrder.OrderNumber

      debug.log('🔍 Datos de selectedLine:', {
        id: selectedLine.id,
        ID: selectedLine.ID,
        code: selectedLine.code,
        Code: selectedLine.Code,
        line: selectedLine.line,
        Line: selectedLine.Line,
        sap_code: selectedLine.sap_code,
        selectedLineCompleto: selectedLine
      })

      if (!prodLineId) {
        const errorMsg = 'No se pudo obtener el ID de la línea de producción. Propiedades disponibles: ' + Object.keys(selectedLine).join(', ')
        debug.error('❌', errorMsg)
        showError(errorMsg)
        return
      }

      debug.log('🔄 Cargando dosificadores y hoppers desde API:', { 
        prodLineId, 
        orderNumber,
        headers: {
          'ProdLine_ID': String(prodLineId),
          'SapOrderCode': orderNumber
        }
      })

      const response = await api.get('/asset/dosingbyline', {
        headers: {
          'ProdLine_ID': String(prodLineId),
          'SapOrderCode': orderNumber
        }
      })

      debug.log('✅ Respuesta completa de /asset/dosingbyline:', JSON.stringify(response, null, 2))

      // Manejar diferentes estructuras de respuesta
      let processedResponse = response
      if (response?.data && Array.isArray(response.data)) {
        processedResponse = response.data
      } else if (Array.isArray(response)) {
        processedResponse = response
      } else {
        debug.error('❌ Respuesta no es un array:', response)
        showError('La respuesta de la API no tiene el formato esperado')
        setDosifiersFromAPI([])
        setHoppersFromAPI([])
        return
      }

      if (processedResponse.length === 0) {
        debug.log('ℹ️ No se encontraron dosificadores para esta línea')
        setDosifiersFromAPI([])
        setHoppersFromAPI([])
        return
      }

      debug.log('📦 Procesando', processedResponse.length, 'dosificadores')

      const dosersData = []
      const hoppersData = []

      processedResponse.forEach((doser, index) => {
        debug.log(`📦 Dosificador ${index + 1}:`, JSON.stringify(doser, null, 2))

        // Intentar diferentes nombres de propiedades
        // Convertir a string para consistencia en comparaciones
        const doserId = String(doser.ID || doser.Id || doser.id || doser.DoserID || doser.DoserId || `doser_${index}`)
        const doserName = doser.Name || doser.name || doser.DoserName || doser.Doser || `Dosificador ${index + 1}`
        const doserDescription = doser.Description || doser.description || doserName
        const doserLocation = doser.Location || doser.location || ''
        const doserCode = doser.Code || doser.code || doser.SapCode || doser.sap_code || doserName

        // Los hoppers son en realidad components (componentes) del dosificador
        const components = doser.Components || doser.components || 
                          doser.Component || doser.component ||
                          []

        debug.log(`  └─ Components encontrados:`, components.length, components)
        debug.log(`  └─ Dosificador ID (string):`, doserId, 'Tipo:', typeof doserId)

        dosersData.push({
          id: doserId,
          name: doserName,
          description: doserDescription,
          location: doserLocation,
          code: doserCode, // Agregar código
          rawData: doser // Guardar datos originales para debugging
        })

        // Procesar components (que son los hoppers)
        if (Array.isArray(components) && components.length > 0) {
          components.forEach((component, componentIndex) => {
            // Convertir a string para consistencia
            const componentId = String(component.ID || component.Id || component.id || 
                               component.ComponentID || component.ComponentId || 
                               component.PartID || component.PartId ||
                               `${doserId}_component_${componentIndex}`)
            const componentName = component.Name || component.name || 
                                 component.ComponentName || component.Component || 
                                 component.PartName || component.Part ||
                                 `Component ${componentIndex + 1}`
            const componentLocation = component.Location || component.location || ''
            const componentCode = component.Code || component.code || component.SapCode || component.sap_code || componentName

            hoppersData.push({
              id: componentId,
              name: componentName,
              dosifierId: doserId, // Ya es string
              dosifierName: doserName,
              location: componentLocation,
              code: componentCode, // Agregar código
              rawData: component // Guardar datos originales para debugging
            })

            debug.log(`    └─ Component (Hopper) agregado:`, { 
              id: componentId, 
              name: componentName, 
              dosifierId: doserId,
              dosifierIdType: typeof doserId
            })
          })
        } else {
          debug.warn(`  ⚠️ Dosificador "${doserName}" no tiene components o la estructura es diferente`)
        }
      })

      setDosifiersFromAPI(dosersData)
      setHoppersFromAPI(hoppersData)
      
      debug.log('📦 Resumen final:', {
        dosificadores: dosersData.length,
        hoppers: hoppersData.length,
        dosersData,
        hoppersData
      })

      if (hoppersData.length === 0) {
        debug.warn('⚠️ No se encontraron components (hoppers) en la respuesta. Estructura de datos:', JSON.stringify(processedResponse, null, 2))
      }
    } catch (err) {
      debug.error('❌ Error cargando dosificadores desde /asset/dosingbyline:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar dosificadores y hoppers'
      showError(`Error: ${errorMessage}`)
      setDosifiersFromAPI([])
      setHoppersFromAPI([])
    } finally {
      setLoadingDosifiersAPI(false)
    }
  }, [selectedLine, selectedOrder, clearError, showError])

  // Función para declarar consumo
  const handleDeclareConsumption = async () => {
    if (!selectedOrder || !selectedLine) {
      showError('Selecciona una orden y línea primero')
      return
    }

    // Validar campos requeridos
    if (!declarationForm.componentSapCode.trim() || !declarationForm.dosifierId.trim() || !declarationForm.hopperId.trim()) {
      showError('Por favor, completa todos los campos requeridos')
      return
    }

    try {
      setAddingConsumption(true)
      clearError()

      // Obtener el nombre del dosificador y hopper desde los datos cargados
      const selectedDosifier = dosifiersFromAPI.find(d => String(d.id) === String(declarationForm.dosifierId))
      const selectedHopper = hoppersFromAPI.find(h => String(h.id) === String(declarationForm.hopperId))

      if (!selectedDosifier || !selectedHopper) {
        debug.error('❌ No se encontraron dosificador o hopper:', {
          dosifierId: declarationForm.dosifierId,
          hopperId: declarationForm.hopperId,
          dosifiersDisponibles: dosifiersFromAPI.map(d => ({ id: d.id, name: d.name })),
          hoppersDisponibles: hoppersFromAPI.map(h => ({ id: h.id, name: h.name, dosifierId: h.dosifierId }))
        })
        showError('Error: No se encontraron los dosificadores o hoppers seleccionados')
        return
      }

      debug.log('✅ Dosificador y hopper seleccionados:', {
        dosifier: {
          id: selectedDosifier.id,
          name: selectedDosifier.name,
          rawData: selectedDosifier.rawData
        },
        hopper: {
          id: selectedHopper.id,
          name: selectedHopper.name,
          dosifierId: selectedHopper.dosifierId,
          rawData: selectedHopper.rawData
        }
      })

      // Obtener factory y prodLine: primero intentar como en handleEditConsumption, luego usar fallbacks como en loadOrders
      // handleEditConsumption usa directamente selectedLine.factory y selectedLine.line
      // Pero si no están disponibles, usar getFactoryFromLine como en loadOrders
      const factory = selectedLine.factory || getFactoryFromLine(selectedLine)
      const prodLine = selectedLine.line || selectedLine.code || ''

      debug.log('🔍 Propiedades de selectedLine (combinando métodos de handleEditConsumption y loadOrders):', {
        factoryDirecta: selectedLine.factory,
        factoryDesdeGetFactory: getFactoryFromLine(selectedLine),
        factoryFinal: factory,
        lineDirecta: selectedLine.line,
        code: selectedLine.code,
        prodLineFinal: prodLine,
        hierarchical_level: selectedLine.hierarchical_level,
        selectedLineCompleto: selectedLine
      })

      // Validar que todos los valores requeridos estén presentes
      if (!factory || !prodLine || !selectedDosifier.name || !selectedHopper.name || !selectedOrder.OrderNumber || !declarationForm.componentSapCode.trim()) {
        debug.error('❌ Faltan valores requeridos:', {
          factory,
          prodLine,
          machine: selectedDosifier.name,
          part: selectedHopper.name,
          orderNumber: selectedOrder.OrderNumber,
          componentCode: declarationForm.componentSapCode.trim(),
          selectedLineCompleto: selectedLine,
          hierarchical_level: selectedLine.hierarchical_level,
          factoryDirecta: selectedLine.factory,
          lineDirecta: selectedLine.line
        })
        showError('Error: Faltan datos requeridos para declarar el consumo. Verifica que la línea tenga factory y line definidos.')
        return
      }

      // Usar EXACTAMENTE el mismo formato que en handleEditConsumption
      // Asegurar que todos los valores estén en el formato correcto (sin espacios extra, etc.)
      // handleEditConsumption usa .trim() en Machine, Part y SapComponentCode
      const headers = {
        'Content-Type': 'application/json',
        'Factory': factory.trim ? factory.trim() : factory,
        'ProdLine': prodLine.trim ? prodLine.trim() : prodLine,
        'System': '',
        'Machine': selectedDosifier.name.trim(),
        'Part': selectedHopper.name.trim(),
        'SapOrderCode': selectedOrder.OrderNumber.trim ? selectedOrder.OrderNumber.trim() : selectedOrder.OrderNumber,
        'SapComponentCode': declarationForm.componentSapCode.trim()
      }
      
      // Asegurar que no haya valores undefined o null
      Object.keys(headers).forEach(key => {
        if (headers[key] === undefined || headers[key] === null) {
          debug.error(`⚠️ Header ${key} tiene valor undefined o null:`, headers[key])
          headers[key] = ''
        }
      })
      
      debug.log('📋 Headers finales para la API (comparar con handleEditConsumption):', {
        headers: headers,
        factory: factory,
        prodLine: prodLine,
        machine: selectedDosifier.name.trim(),
        part: selectedHopper.name.trim(),
        orderNumber: selectedOrder.OrderNumber,
        componentCode: declarationForm.componentSapCode.trim()
      })

      // Comparar headers con los de handleEditConsumption para debugging
      const expectedHeaders = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'System': '',
        'Machine': selectedDosifier.name.trim(),
        'Part': selectedHopper.name.trim(),
        'SapOrderCode': selectedOrder.OrderNumber,
        'SapComponentCode': declarationForm.componentSapCode.trim()
      }
      
      debug.log('🔄 Headers para declarar consumo (comparación con handleEditConsumption):', {
        headersActuales: headers,
        headersEsperados: expectedHeaders,
        sonIguales: JSON.stringify(headers) === JSON.stringify(expectedHeaders),
        factory: {
          actual: factory,
          esperado: selectedLine.factory,
          igual: factory === selectedLine.factory
        },
        prodLine: {
          actual: prodLine,
          esperado: selectedLine.line,
          igual: prodLine === selectedLine.line
        },
        machine: {
          actual: selectedDosifier.name.trim(),
          esperado: selectedDosifier.name.trim(),
          igual: true
        },
        part: {
          actual: selectedHopper.name.trim(),
          esperado: selectedHopper.name.trim(),
          igual: true
        },
        orderNumber: selectedOrder.OrderNumber,
        componentCode: declarationForm.componentSapCode.trim()
      })

      // Permitir múltiples declaraciones para la misma combinación (componente, dosificador, hopper)
      // La API manejará las declaraciones repetidas según su lógica
      debug.log('🔄 Declarando consumo (se permiten múltiples declaraciones):', {
        component: declarationForm.componentSapCode,
        dosifier: selectedDosifier.name,
        hopper: selectedHopper.name,
        headers: headers,
        url: `${import.meta.env.VITE_API_URL || 'http://18.213.58.26:8081'}/sap/orderConsump/add`
      })
      
      const componentCode = declarationForm.componentSapCode.trim()
      
      // Llamar a la API del backend para declarar el consumo
      try {
        // Log detallado de lo que se va a enviar
        debug.log('📡 Llamando a la API /sap/orderConsump/add:', {
          endpoint: '/sap/orderConsump/add',
          headers: headers,
          headersString: JSON.stringify(headers),
          urlCompleta: `${import.meta.env.VITE_API_URL || 'http://18.213.58.26:8081'}/sap/orderConsump/add`,
          comparacionConEdit: {
            factory: {
              declarar: factory,
              editar: selectedLine.factory,
              igual: factory === selectedLine.factory
            },
            prodLine: {
              declarar: prodLine,
              editar: selectedLine.line,
              igual: prodLine === selectedLine.line
            }
          }
        })
        
        await api.get('/sap/orderConsump/add', {
          headers: headers,
        })
        
        debug.log('✅ API respondió correctamente, recargando datos...')
        
        // Si el backend responde correctamente, recargar datos
        await new Promise(resolve => setTimeout(resolve, 500))
        await loadConsumptions()
        await loadRecipe(true)
        
        showSuccess('Consumo declarado exitosamente')
      } catch (backendErr) {
        debug.error('❌ Error al llamar a la API del backend:', {
          message: backendErr.message,
          status: backendErr.status,
          response: backendErr.response,
          component: componentCode
        })
        
        showError(backendErr.message && backendErr.message.includes('Registro no insertado') ? 'El backend no pudo procesar la declaración' : 'Error al comunicarse con el backend')
      }

      // Limpiar formulario
      setDeclarationForm({
        componentSapCode: '',
        dosifierId: '',
        hopperId: ''
      })
    } catch (err) {
      // Solo errores críticos que ocurran antes de guardar la cantidad localmente
      // Construir objeto de logging de forma segura
      const errorLogData = {
        error: err,
        message: err.message,
        status: err.status,
        response: err.response
      }
      
      // Agregar headers solo si está definido (puede no estar si el error ocurre antes)
      try {
        if (typeof headers !== 'undefined') {
          errorLogData.headers = headers
        }
        if (typeof selectedDosifier !== 'undefined') {
          errorLogData.selectedDosifier = selectedDosifier
        }
        if (typeof selectedHopper !== 'undefined') {
          errorLogData.selectedHopper = selectedHopper
        }
      } catch (e) {
        // Ignorar errores al construir el log
      }
      
      errorLogData.selectedLine = selectedLine
      errorLogData.selectedOrder = selectedOrder
      
      debug.error('❌ Error crítico al declarar consumo:', errorLogData)
      
      // Intentar obtener más detalles del error
      let errorMessage = 'Error al declarar el consumo'
      
      // El servidor puede devolver mensajes específicos como "Registro no insertado"
      if (err.message && err.message !== `HTTP error! status: ${err.status}`) {
        errorMessage = err.message
        
        // Mensaje más específico para "Registro no insertado"
        if (err.message.includes('Registro no insertado')) {
          errorMessage = 'No se pudo insertar el registro. Posibles causas:\n' +
            '• Ya existe un consumo duplicado para esta combinación (componente, dosificador y hopper)\n' +
            '• Los datos enviados no son válidos según las reglas del backend\n' +
            '• Falta algún dato requerido que el backend necesita\n\n' +
            'Verifica los logs de la consola para ver los datos exactos que se están enviando.'
        }
      } else if (err.status === 500) {
        errorMessage = 'Error del servidor (500). Verifica los logs del backend para más detalles. Posibles causas: valores incorrectos en los headers o problema en el procesamiento del servidor.'
      }
      
      showError(errorMessage)
    } finally {
      setAddingConsumption(false)
    }
  }

  // Funciones para manejar Inicio y Fin de OF
  const handleOpenStartModal = () => {
    // Convertir la fecha actual a formato datetime-local si existe
    if (ofStartDateTime) {
      const date = new Date(ofStartDateTime)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      setTempStartDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    } else {
      // Si no hay fecha, usar la fecha y hora actual
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setTempStartDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    }
    setShowStartModal(true)
  }

  const handleSaveStartDateTime = () => {
    if (tempStartDateTime) {
      setOfStartDateTime(new Date(tempStartDateTime))
      showSuccess('Fecha y hora de inicio de OF guardada correctamente')
    }
    setShowStartModal(false)
  }

  const handleOpenEndModal = () => {
    // Convertir la fecha actual a formato datetime-local si existe
    if (ofEndDateTime) {
      const date = new Date(ofEndDateTime)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      setTempEndDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    } else {
      // Si no hay fecha, usar la fecha y hora actual
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setTempEndDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    }
    setShowEndModal(true)
  }

  const handleSaveEndDateTime = () => {
    if (tempEndDateTime) {
      setOfEndDateTime(new Date(tempEndDateTime))
      showSuccess('Fecha y hora de fin de OF guardada correctamente')
    }
    setShowEndModal(false)
  }

  // Función para formatear fecha y hora para mostrar
  const formatDateTime = (date) => {
    if (!date) return 'No establecida'
    const d = new Date(date)
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }


  // Cargar dosificadores y hoppers cuando cambian la línea u orden
  useEffect(() => {
    if (selectedLine && selectedOrder) {
      loadDosifiersAndHoppersFromAPI()
    } else {
      setDosifiersFromAPI([])
      setHoppersFromAPI([])
    }
  }, [selectedLine, selectedOrder, loadDosifiersAndHoppersFromAPI])

  // Funciones CRUD para Dosificadores
  const loadDosifiers = useCallback(() => {
    // Extraer dosificadores únicos de los consumos
    const dosersList = [...new Set(consumptions.map(c => c.DosingUnit).filter(Boolean))].sort()
    const dosersData = dosersList.map(doser => ({
      id: doser,
      name: doser
    }))
    setDosifiers(dosersData)
  }, [consumptions])

  const handleAddDosifier = async (formData) => {
    try {
      setManagingCRUD(true)
      clearError()
      // Por ahora, solo actualizamos el estado local
      // En el futuro, esto podría llamar a un endpoint del backend
      setDosifiers(prev => [...prev, { id: formData.name, name: formData.name, description: formData.description }])
      showSuccess('Dosificador agregado exitosamente')
      loadDosifiers()
    } catch (err) {
      debug.error('Error adding dosifier:', err)
      showError('Error al agregar el dosificador')
    } finally {
      setManagingCRUD(false)
    }
  }

  const handleEditDosifier = async (id, formData) => {
    try {
      setManagingCRUD(true)
      clearError()
      setDosifiers(prev => prev.map(d => d.id === id ? { ...d, ...formData } : d))
      showSuccess('Dosificador editado exitosamente')
    } catch (err) {
      debug.error('Error editing dosifier:', err)
      showError('Error al editar el dosificador')
    } finally {
      setManagingCRUD(false)
    }
  }

  const handleDeleteDosifier = async (id) => {
    try {
      setManagingCRUD(true)
      clearError()
      setDosifiers(prev => prev.filter(d => d.id !== id))
      showSuccess('Dosificador eliminado exitosamente')
    } catch (err) {
      debug.error('Error deleting dosifier:', err)
      showError('Error al eliminar el dosificador')
    } finally {
      setManagingCRUD(false)
    }
  }

  // Funciones CRUD para Hoppers
  const loadHoppers = useCallback(() => {
    // Extraer hoppers únicos de los consumos
    const uniqueHoppers = []
    const seen = new Set()
    
    consumptions.forEach(consumption => {
      const doser = consumption.DosingUnit || 'Sin Dosificador'
      const hopper = consumption.DosingHopper || 'Sin Hopper'
      const key = `${doser}-${hopper}`
      
      if (!seen.has(key)) {
        seen.add(key)
        uniqueHoppers.push({
          id: key,
          name: hopper,
          dosifier: doser,
          dosifierId: doser
        })
      }
    })
    
    setHoppers(uniqueHoppers)
  }, [consumptions])

  const handleAddHopper = async (formData) => {
    try {
      setManagingCRUD(true)
      clearError()
      setHoppers(prev => [...prev, {
        id: `${formData.dosifierId}-${formData.name}`,
        name: formData.name,
        dosifier: formData.dosifierId,
        dosifierId: formData.dosifierId,
        description: formData.description
      }])
      showSuccess('Hopper agregado exitosamente')
      loadHoppers()
    } catch (err) {
      debug.error('Error adding hopper:', err)
      showError('Error al agregar el hopper')
    } finally {
      setManagingCRUD(false)
    }
  }

  const handleEditHopper = async (id, formData) => {
    try {
      setManagingCRUD(true)
      clearError()
      setHoppers(prev => prev.map(h => h.id === id ? { ...h, ...formData } : h))
      showSuccess('Hopper editado exitosamente')
    } catch (err) {
      debug.error('Error editing hopper:', err)
      showError('Error al editar el hopper')
    } finally {
      setManagingCRUD(false)
    }
  }

  const handleDeleteHopper = async (id) => {
    try {
      setManagingCRUD(true)
      clearError()
      setHoppers(prev => prev.filter(h => h.id !== id))
      showSuccess('Hopper eliminado exitosamente')
    } catch (err) {
      debug.error('Error deleting hopper:', err)
      showError('Error al eliminar el hopper')
    } finally {
      setManagingCRUD(false)
    }
  }

  // Funciones CRUD para Componentes
  const loadComponents = useCallback(() => {
    // Extraer componentes únicos de los consumos
    const compsList = [...new Set(consumptions.map(c => c.ComponentSapCode).filter(Boolean))].sort()
    const compsData = compsList.map(comp => ({
      id: comp,
      sapCode: comp,
      ComponentSapCode: comp
    }))
    setComponents(compsData)
  }, [consumptions])

  const handleAddComponent = async (formData) => {
    try {
      setManagingCRUD(true)
      clearError()
      setComponents(prev => [...prev, {
        id: formData.sapCode,
        sapCode: formData.sapCode,
        ComponentSapCode: formData.sapCode,
        description: formData.description,
        unit: formData.unit
      }])
      showSuccess('Componente agregado exitosamente')
      loadComponents()
    } catch (err) {
      debug.error('Error adding component:', err)
      showError('Error al agregar el componente')
    } finally {
      setManagingCRUD(false)
    }
  }

  const handleEditComponent = async (id, formData) => {
    try {
      setManagingCRUD(true)
      clearError()
      setComponents(prev => prev.map(c => c.id === id ? { ...c, ...formData, ComponentSapCode: formData.sapCode } : c))
      showSuccess('Componente editado exitosamente')
    } catch (err) {
      debug.error('Error editing component:', err)
      showError('Error al editar el componente')
    } finally {
      setManagingCRUD(false)
    }
  }

  const handleDeleteComponent = async (id) => {
    try {
      setManagingCRUD(true)
      clearError()
      setComponents(prev => prev.filter(c => c.id !== id))
      showSuccess('Componente eliminado exitosamente')
    } catch (err) {
      debug.error('Error deleting component:', err)
      showError('Error al eliminar el componente')
    } finally {
      setManagingCRUD(false)
    }
  }

  // Cargar datos cuando cambian los consumos
  useEffect(() => {
    if (consumptions.length > 0) {
      loadDosifiers()
      loadHoppers()
      loadComponents()
    }
  }, [consumptions, loadDosifiers, loadHoppers, loadComponents])


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
              ) : (linesWithData.length === 0 && lines.length === 0) ? (
                <EmptyState
                  icon={Factory}
                  title="No hay líneas disponibles"
                  description={`No se encontraron líneas de producción${selectedFactory ? ` para la fábrica ${selectedFactory}` : ''}`}
                />
              ) : (
                <div className="space-y-4">
                  {/* Mostrar líneas con datos completos primero */}
                  {linesWithData.length > 0 && linesWithData.map((line) => {
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
                              {(line.speed !== undefined && line.speed !== null) || 
                               (line.production !== undefined && line.production !== null) || 
                               (line.oee !== undefined && line.oee !== null) ||
                               line.last_update ? (
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
                                  {line.oee !== undefined && line.oee !== null && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-400">OEE:</span>
                                      <span className={`text-lg font-bold font-mono ${
                                        line.oee >= 85 ? 'text-green-500' :
                                        line.oee >= 70 ? 'text-yellow-500' :
                                        'text-red-500'
                                      }`}>
                                        {line.oee.toFixed(1)}%
                                      </span>
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
                              ) : (
                                <div className="flex items-center justify-center h-full min-h-[150px]">
                                  <div className="text-center">
                                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Sin métricas disponibles</p>
                                  </div>
                                </div>
                              )}
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
                  
                  {/* Mostrar líneas sin datos completos (si hay líneas que no están en linesWithData o si linesWithData está vacío) */}
                  {(lines.length > linesWithData.length || linesWithData.length === 0) && lines
                    .filter(line => linesWithData.length === 0 || !linesWithData.find(lwd => (lwd.id || lwd.code) === (line.id || line.code)))
                    .map((line) => {
                      return (
                        <Card 
                          key={line.id || line.code}
                          className="cursor-pointer hover:border-blue-500 transition-all"
                          onClick={() => setSelectedLine(line)}
                        >
                          <div className="p-6">
                            {/* Header de la línea */}
                            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-4">
                              <div className="flex items-center gap-4">
                                <Factory className="w-8 h-8 text-blue-400" />
                                <div>
                                  <h3 className="text-2xl font-bold text-white">{line.line || line.code}</h3>
                                  <p className="text-sm text-gray-400">{line.location || line.factory} • <span className="font-mono">{line.code || line.sap_code || 'N/A'}</span></p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary">
                                  Sin datos
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Información básica de la línea */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                <span className="text-sm text-gray-400">Estado:</span>
                                <Badge variant="secondary">Disponible</Badge>
                              </div>
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-400 mb-2">Haz clic para ver detalles y órdenes</p>
                                {loadingLineData && (
                                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Cargando información adicional...</span>
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
                  const isSelected = selectedOrder && selectedOrder.OrderNumber === order.OrderNumber
                  
                  return (
                    <Card 
                      key={index}
                      className={`transition-all cursor-pointer ${isSelected ? 'border-blue-500 border-2' : 'hover:border-blue-500'}`}
                      onClick={() => {
                        setSelectedOrder(order)
                        // Scroll suave a la sección de receta después de un breve delay
                        setTimeout(() => {
                          const recipeSection = document.querySelector('[data-recipe-section]')
                          if (recipeSection) {
                            recipeSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }, 100)
                      }}
                    >
                      <div className="p-6">
                        {/* Header de la orden */}
                        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-4">
                          <div className="flex items-center gap-4">
                            <Package className="w-8 h-8 text-blue-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-bold text-white font-mono">{order.OrderNumber}</h3>
                                {isSelected && (
                                  <Badge variant="info" className="text-xs">
                                    Seleccionada
                                  </Badge>
                                )}
                              </div>
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        </div>
                      </div>
                    </Card>
                  )
                })}</div>
              </>
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
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recipe and Components */}
            <div data-recipe-section>
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
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Cantidad Declarada</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Unidad</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Cantidad Retirada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipe.Components.map((component, index) => {
                          const componentCode = (component.SapCode || '').trim()
                          
                          return (
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
                            <td className="py-3 px-4 text-right">
                              {(() => {
                                // Calcular cantidad declarada sumando los consumos para este componente
                                const declaredQuantityFromConsumptions = consumptions
                                  .filter(c => {
                                    // Comparar códigos SAP (pueden tener espacios o diferencias de formato)
                                    const consumptionCode = (c.ComponentSapCode || '').trim().toUpperCase()
                                    const compCode = componentCode.toUpperCase()
                                    return consumptionCode === compCode
                                  })
                                  .reduce((sum, c) => {
                                    const qty = parseFloat(c.CommittedQuantity) || 0
                                    return sum + qty
                                  }, 0)
                                
                                // Mostrar la cantidad declarada calculada desde los consumos
                                const displayQuantity = declaredQuantityFromConsumptions > 0 
                                  ? declaredQuantityFromConsumptions.toFixed(3) 
                                  : '0'
                                
                                return (
                                  <span className="text-white font-medium">
                                    {displayQuantity}
                                  </span>
                                )
                              })()}
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">{component.MeasurementUnitCQ || component.MeasurementUnitRQ || '-'}</td>
                            <td className="py-3 px-4 text-right text-white font-medium">{component.WithDrawnQuantity || '0'}</td>
                          </tr>
                          )
                        })}
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
            </div>

            {/* Botones de Inicio y Fin de OF */}
            {selectedLine && selectedOrder && (
              <Card className="mb-6">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Botón Inicio OF */}
                    <div className="flex-1">
                      <button
                        onClick={handleOpenStartModal}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white"
                      >
                        <div className="flex items-center gap-3">
                          <PlayCircle className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-semibold">Inicio OF</div>
                            <div className="text-xs text-green-100">
                              {formatDateTime(ofStartDateTime)}
                            </div>
                          </div>
                        </div>
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Botón Fin OF */}
                    <div className="flex-1">
                      <button
                        onClick={handleOpenEndModal}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
                      >
                        <div className="flex items-center gap-3">
                          <Square className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-semibold">Fin OF</div>
                            <div className="text-xs text-red-100">
                              {formatDateTime(ofEndDateTime)}
                            </div>
                          </div>
                        </div>
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Card de Declaración de Consumo */}
            {selectedLine && selectedOrder && recipe && recipe.Components && recipe.Components.length > 0 && (
              <Card className="mb-6">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Declaración de Consumo</h3>
                    <Badge variant="info">Nuevo</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-6">
                    Asocia un componente de la receta con un dosificador y hopper para declarar el consumo
                  </p>

                  {loadingDosifiersAPI ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-3" />
                      <p className="text-gray-400">Cargando dosificadores y hoppers...</p>
                    </div>
                  ) : dosifiersFromAPI.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No se encontraron dosificadores para esta línea</p>
                      <button
                        onClick={loadDosifiersAndHoppersFromAPI}
                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-sm"
                      >
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Recargar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selector de Componente */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Componente de la Receta <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={declarationForm.componentSapCode}
                          onChange={(e) => {
                            setDeclarationForm(prev => ({
                              ...prev,
                              componentSapCode: e.target.value,
                              // Limpiar hopper cuando cambia el componente
                              hopperId: ''
                            }))
                          }}
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Selecciona un componente</option>
                          {recipe.Components.map((component, idx) => (
                            <option key={idx} value={component.SapCode}>
                              {component.SapCode} - {component.Description || 'Sin descripción'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selector de Dosificador */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Dosificador <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={declarationForm.dosifierId}
                          onChange={(e) => {
                            setDeclarationForm(prev => ({
                              ...prev,
                              dosifierId: e.target.value,
                              // Limpiar hopper cuando cambia el dosificador
                              hopperId: ''
                            }))
                          }}
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Selecciona un dosificador</option>
                          {dosifiersFromAPI.map((dosifier) => (
                            <option key={dosifier.id} value={dosifier.id}>
                              {dosifier.code || dosifier.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selector de Hopper */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Hopper <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={declarationForm.hopperId}
                          onChange={(e) => setDeclarationForm(prev => ({ ...prev, hopperId: e.target.value }))}
                          disabled={!declarationForm.dosifierId}
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {declarationForm.dosifierId ? 'Selecciona un hopper' : 'Primero selecciona un dosificador'}
                          </option>
                          {hoppersFromAPI
                            .filter(hopper => {
                              // Comparar como strings para evitar problemas de tipo
                              const hopperDosifierId = String(hopper.dosifierId)
                              const selectedDosifierId = String(declarationForm.dosifierId)
                              const matches = hopperDosifierId === selectedDosifierId
                              
                              // Debug en desarrollo
                              if (isDev && declarationForm.dosifierId) {
                                debug.log('🔍 Filtrando hopper:', {
                                  hopperId: hopper.id,
                                  hopperName: hopper.name,
                                  hopperDosifierId,
                                  selectedDosifierId,
                                  matches,
                                  allHoppers: hoppersFromAPI.map(h => ({ id: h.id, dosifierId: String(h.dosifierId) }))
                                })
                              }
                              
                              return matches
                            })
                            .map((hopper) => (
                              <option key={hopper.id} value={hopper.id}>
                                {hopper.code || hopper.name}
                              </option>
                            ))}
                        </select>
                        {declarationForm.dosifierId && hoppersFromAPI.filter(h => String(h.dosifierId) === String(declarationForm.dosifierId)).length === 0 && (
                          <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                            <p className="text-xs text-yellow-400 mb-2">
                              ⚠️ No hay components (hoppers) disponibles para este dosificador
                            </p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>• Total de components cargados: {hoppersFromAPI.length}</p>
                              <p>• Dosificador seleccionado ID: {declarationForm.dosifierId}</p>
                              {isDev && (
                                <>
                                  <p>• Components (Hoppers) disponibles: {JSON.stringify(hoppersFromAPI.map(h => ({ id: h.id, dosifierId: h.dosifierId, name: h.name })), null, 2)}</p>
                                  <p>• Dosificadores cargados: {JSON.stringify(dosifiersFromAPI.map(d => ({ id: d.id, name: d.name })), null, 2)}</p>
                                </>
                              )}
                            </div>
                            <button
                              onClick={loadDosifiersAndHoppersFromAPI}
                              className="mt-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-xs flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Recargar desde API
                            </button>
                          </div>
                        )}
                      </div>


                      {/* Botón de Declarar */}
                      <div className="flex justify-end pt-4 border-t border-gray-700">
                        <button
                          onClick={handleDeclareConsumption}
                          disabled={addingConsumption || !declarationForm.componentSapCode || !declarationForm.dosifierId || !declarationForm.hopperId}
                          className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
                        >
                          {addingConsumption ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Declarando...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Declarar Consumo</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Card de Declaraciones Registradas */}
            {selectedLine && selectedOrder && consumptions && consumptions.length > 0 && (
              <Card className="mb-6">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Declaraciones Registradas</h3>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm">
                        {consumptions.length} {consumptions.length === 1 ? 'declaración' : 'declaraciones'}
                      </Badge>
                      <button
                        onClick={handleCalculateConsumptions}
                        disabled={loadingConsumptions}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm font-medium"
                        title="Calcular consumos desde InfluxDB y actualizar cantidades declaradas"
                      >
                        {loadingConsumptions ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Calculando...</span>
                          </>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4" />
                            <span>Calcular</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleSendToSAP}
                        disabled={sendingToSAP || loadingConsumptions || !consumptions || consumptions.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-white text-sm font-medium"
                        title="Enviar consumos a SAP y guardar en base de datos"
                      >
                        {sendingToSAP ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4" />
                            <span>Enviar a SAP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {consumptions.map((consumption, index) => {
                      const component = recipe?.Components?.find(c => c.SapCode === consumption.ComponentSapCode)
                      const unit = component?.MeasurementUnitRQ || component?.MeasurementUnitCQ || 'KG'
                      
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm font-semibold text-blue-400">
                                    {consumption.ComponentSapCode || '-'}
                                  </span>
                                  {component?.Description && (
                                    <span className="text-xs text-gray-400 truncate">
                                      {component.Description}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                  <span>
                                    <span className="text-gray-500">Dosificador:</span>{' '}
                                    <span className="text-white font-mono">{consumption.DosingUnit || '-'}</span>
                                  </span>
                                  <span>
                                    <span className="text-gray-500">Hopper:</span>{' '}
                                    <span className="text-white font-mono">{consumption.DosingHopper || '-'}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            {consumption.CommittedQuantity && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-400">Cantidad:</span>
                                <span className="text-lg font-bold text-green-400">
                                  {parseFloat(consumption.CommittedQuantity).toFixed(3)} {unit}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => {
                                setEditingConsumption(consumption)
                                setShowEditModal(true)
                              }}
                              disabled={addingConsumption}
                              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                              title="Editar declaración"
                            >
                              <Edit className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleDeleteConsumption(consumption)}
                              disabled={addingConsumption}
                              className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                              title="Eliminar declaración"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {consumptions.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay declaraciones registradas</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Edit Consumption Modal */}
        {showEditModal && editingConsumption && (
          <EditConsumptionModal
            consumption={editingConsumption}
            selectedOrder={selectedOrder}
            onClose={() => {
              setShowEditModal(false)
              setEditingConsumption(null)
              clearError()
            }}
            onSubmit={handleEditConsumption}
            isSubmitting={addingConsumption}
          />
        )}

        {/* Dosifier Manager Modal */}
        <DosifierManagerModal
          isOpen={showDosifierModal}
          onClose={() => setShowDosifierModal(false)}
          dosifiers={dosifiers}
          onAdd={handleAddDosifier}
          onEdit={handleEditDosifier}
          onDelete={handleDeleteDosifier}
          isSubmitting={managingCRUD}
        />

        {/* Hopper Manager Modal */}
        <HopperManagerModal
          isOpen={showHopperModal}
          onClose={() => setShowHopperModal(false)}
          hoppers={hoppers}
          dosifiers={dosifiers}
          onAdd={handleAddHopper}
          onEdit={handleEditHopper}
          onDelete={handleDeleteHopper}
          isSubmitting={managingCRUD}
        />

        {/* Component Manager Modal */}
        <ComponentManagerModal
          isOpen={showComponentModal}
          onClose={() => setShowComponentModal(false)}
          components={components}
          onAdd={handleAddComponent}
          onEdit={handleEditComponent}
          onDelete={handleDeleteComponent}
          isSubmitting={managingCRUD}
        />

        {/* Modal para editar Inicio OF */}
        {showStartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-green-500" />
                    Inicio de OF
                  </h3>
                  <button
                    onClick={() => setShowStartModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha y Hora de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={tempStartDateTime}
                    onChange={(e) => setTempStartDateTime(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowStartModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveStartDateTime}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Modal para editar Fin OF */}
        {showEndModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Square className="w-5 h-5 text-red-500" />
                    Fin de OF
                  </h3>
                  <button
                    onClick={() => setShowEndModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha y Hora de Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={tempEndDateTime}
                    onChange={(e) => setTempEndDateTime(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEndModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEndDateTime}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                  >
                    Guardar
                  </button>
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

