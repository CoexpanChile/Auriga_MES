import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronDown, Factory, Loader2, Info, Search } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { AssetDetailPanel } from '../../components/AssetDetailPanel'
import { api } from '../../lib/api'
import { useLanguage } from '../../context/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'

function JerarquiaActivos() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const { permissions, checkFactoryAccess } = usePermissions()
  
  // Obtener fábrica seleccionada desde localStorage (sin prefijo en URL)
  // Usar useState para que se actualice cuando cambie
  // Validar que el usuario tenga acceso a la fábrica seleccionada
  const getSelectedFactory = () => {
    const saved = localStorage.getItem('selectedFactory')
    if (!saved) return null
    
    // Si es 'CX', verificar que el usuario tenga acceso
    if (saved === 'CX') {
      // Verificar permisos si están disponibles
      if (permissions) {
        const hasCXAccess = checkFactoryAccess('CX')
        if (!hasCXAccess) {
          // Si no tiene acceso a CX, limpiar la selección
          localStorage.removeItem('selectedFactory')
          return null
        }
      }
      return null // 'CX' se maneja como null para vista global
    }
    
    // Para otras fábricas, verificar acceso si los permisos están disponibles
    if (permissions) {
      const hasAccess = checkFactoryAccess(saved)
      if (!hasAccess) {
        // Si no tiene acceso, limpiar la selección
        localStorage.removeItem('selectedFactory')
        return null
      }
    }
    
    return saved
  }
  
  const [selectedFactory, setSelectedFactory] = useState(getSelectedFactory())
  const [hierarchies, setHierarchies] = useState({})
  const [currentNode, setCurrentNode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [assetDetails, setAssetDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [searchQuery, setSearchQuery] = useState('')

  // Hook para responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Revalidar selectedFactory cuando cambien los permisos
  useEffect(() => {
    if (permissions) {
      const saved = localStorage.getItem('selectedFactory')
      if (!saved) {
        if (selectedFactory) setSelectedFactory(null)
        return
      }
      
      // Si es 'CX', verificar que el usuario tenga acceso
      if (saved === 'CX') {
        const hasCXAccess = checkFactoryAccess('CX')
        if (!hasCXAccess && selectedFactory) {
          localStorage.removeItem('selectedFactory')
          setSelectedFactory(null)
        }
      } else {
        // Para otras fábricas, verificar acceso
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

  // Escuchar cambios en localStorage para actualizar selectedFactory
  useEffect(() => {
    const handleFactoryChange = () => {
      const saved = localStorage.getItem('selectedFactory')
      if (!saved) {
        setSelectedFactory(null)
        return
      }
      
      // Validar acceso antes de actualizar
      if (permissions) {
        if (saved === 'CX') {
          const hasCXAccess = checkFactoryAccess('CX')
          if (!hasCXAccess) {
            localStorage.removeItem('selectedFactory')
            setSelectedFactory(null)
            return
          }
        } else {
          const hasAccess = checkFactoryAccess(saved)
          if (!hasAccess) {
            localStorage.removeItem('selectedFactory')
            setSelectedFactory(null)
            return
          }
        }
      }
      
      const newFactory = saved === 'CX' ? null : saved
      setSelectedFactory(prevFactory => {
        if (newFactory !== prevFactory) {
          return newFactory
        }
        return prevFactory
      })
    }

    // Escuchar evento storage (cuando cambia en otra pestaña/ventana)
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
  }, [permissions, checkFactoryAccess])

  useEffect(() => {
    // Limpiar estado cuando cambia la fábrica
    setCurrentNode(null)
    setSelectedAssetId(null)
    setAssetDetails(null)
    setExpandedNodes(new Set())
    setSearchQuery('')
    // Recargar jerarquías
    loadHierarchies()
  }, [selectedFactory])

  // Cargar detalles del activo seleccionado
  useEffect(() => {
    if (selectedAssetId) {
      loadAssetDetails(selectedAssetId)
    } else {
      setAssetDetails(null)
    }
  }, [selectedAssetId])

  // Construir jerarquía desde la lista de assets usando ParentID
  const buildHierarchy = (assets) => {
    const hierarchies = {}
    
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      console.warn('buildHierarchy: No assets provided or empty array')
      return hierarchies
    }
    
    console.log('Building hierarchy from', assets.length, 'assets')
    console.log('Sample asset structure:', assets[0])
    
    // Normalizar campos (soporta mayúsculas y minúsculas)
    const normalizeAsset = (asset) => {
      return {
        id: asset.ID !== undefined ? asset.ID : asset.id,
        parentId: asset.ParentID !== undefined ? asset.ParentID : asset.ParentId !== undefined ? asset.ParentId : asset.parentId !== undefined ? asset.parentId : asset.parent_id,
        code: asset.Code !== undefined ? asset.Code : asset.code,
        name: asset.Name !== undefined ? asset.Name : asset.name,
        location: asset.Location !== undefined ? asset.Location : asset.location,
        factory: asset.Factory !== undefined ? asset.Factory : asset.factory,
        ...asset // Mantener todos los campos originales
      }
    }
    
    // Normalizar todos los assets
    const normalizedAssets = assets.map(normalizeAsset)
    
    // Crear mapa de assets por ID para acceso rápido
    const assetMap = new Map()
    normalizedAssets.forEach(asset => {
      if (asset.id != null) {
        assetMap.set(asset.id, { ...asset, children: [] })
      }
    })
    
    console.log('Asset map created with', assetMap.size, 'assets')
    
    // Identificar nodos raíz (sin padre o ParentID === null)
    const rootNodes = []
    normalizedAssets.forEach(asset => {
      if (asset.id != null && (asset.parentId == null || asset.parentId === null || asset.parentId === '')) {
        rootNodes.push(asset)
      }
    })
    
    console.log('Root nodes found:', rootNodes.length)
    rootNodes.forEach(root => {
      console.log('  - Root:', root.code, 'ID:', root.id)
    })
    
    // Función recursiva para construir el árbol
    const buildTree = (asset) => {
      const node = assetMap.get(asset.id)
      if (!node) return null
      
      // Buscar todos los hijos de este nodo
      const children = normalizedAssets
        .filter(child => {
          const childParentId = child.parentId
          return childParentId != null && childParentId === asset.id
        })
        .map(child => buildTree(child))
        .filter(Boolean) // Remover nulls
      
      if (children.length > 0) {
        node.children = children
      }
      
      return node
    }
    
    // Construir árboles para cada nodo raíz
    rootNodes.forEach(rootAsset => {
      const tree = buildTree(rootAsset)
      if (tree) {
        // Usar el código del root como clave de fábrica
        const factoryCode = rootAsset.code || rootAsset.factory || `ROOT_${rootAsset.id}`
        hierarchies[factoryCode] = tree
      }
    })
    
    // Ordenar children en cada nivel recursivamente
    const sortChildren = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => {
          const aCode = (a.code || '').toString()
          const bCode = (b.code || '').toString()
          return aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: 'base' })
        })
        node.children.forEach(sortChildren)
      }
    }
    
    Object.values(hierarchies).forEach(sortChildren)
    
    console.log(`buildHierarchy completed: ${Object.keys(hierarchies).length} root hierarchies built`)
    console.log('Factory keys:', Object.keys(hierarchies))
    
    return hierarchies
  }

  const loadHierarchies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Verificar autenticación antes de hacer la petición
      try {
        const authCheck = await fetch('/api/auth/check', {
          credentials: 'include'
        })
        if (!authCheck.ok) {
          console.warn('Sesión no válida, redirigiendo a login...')
          window.location.href = '/login'
          return
        }
      } catch (authError) {
        console.error('Error verificando autenticación:', authError)
        window.location.href = '/login'
        return
      }
      
      // Usar /asset/list y construir la jerarquía en el cliente
      const response = await api.get('/asset/list')
      
      // La respuesta podría ser un array directo o un objeto con datos
      let assets = []
      if (Array.isArray(response)) {
        assets = response
      } else if (response && Array.isArray(response.data)) {
        assets = response.data
      } else if (response && response.assets && Array.isArray(response.assets)) {
        assets = response.assets
      } else if (response && typeof response === 'object') {
        // Intentar extraer cualquier array del objeto
        const keys = Object.keys(response)
        const arrayKey = keys.find(key => Array.isArray(response[key]))
        if (arrayKey) {
          assets = response[arrayKey]
        }
      }
      
      console.log('API Response:', response)
      console.log('Assets extracted:', assets.length, 'items')
      console.log('First asset sample:', assets[0])
      
      if (assets.length === 0) {
        console.warn('No assets found in response')
        setHierarchies({})
        setLoading(false)
        return
      }
      
      // Filtrar por fábrica si se especifica (después de construir la jerarquía)
      // No filtramos antes porque necesitamos toda la jerarquía para construir correctamente
      let filteredAssets = assets
      console.log('Total assets before filtering:', filteredAssets.length)
      
      // Construir jerarquía desde los assets
      const hierarchies = buildHierarchy(filteredAssets)
      
      console.log('Hierarchies built:', Object.keys(hierarchies).length, 'factories')
      console.log('Factory keys:', Object.keys(hierarchies))
      
      if (Object.keys(hierarchies).length === 0) {
        console.warn('No hierarchies built from assets. Sample asset:', filteredAssets[0])
      }
      
      // Si hay una fábrica seleccionada, solo incluir esa
      if (selectedFactory && hierarchies[selectedFactory]) {
        setHierarchies({ [selectedFactory]: hierarchies[selectedFactory] })
      } else {
        setHierarchies(hierarchies)
      }
      
    } catch (err) {
      console.error('Error loading hierarchies:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      setError('Error de conexión: ' + (err.message || 'Desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const loadAssetDetails = async (assetId) => {
    if (!assetId) {
      setAssetDetails(null)
      return
    }
    
    try {
      setLoadingDetails(true)
      const data = await api.get(`/asset/showdetail/${assetId}`)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Asset details loaded in hierarchy:', {
          hasProduct: !!data.Product,
          hasProductDocuments: !!(data.Product?.Documents),
          productDocumentsCount: data.Product?.Documents?.length || 0,
          hasAssetDocuments: !!data.Documents,
          assetDocumentsCount: data.Documents?.length || 0
        })
      }
      setAssetDetails(data)
    } catch (err) {
      console.error('Error loading asset details:', err)
      setAssetDetails(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleAssetSelect = (assetId, event) => {
    if (event && event.target.closest('.detail-button')) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    setSelectedAssetId(assetId)
  }

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    const nodeIds = new Set()
    Object.values(hierarchies).forEach(factory => {
      const collectIds = (n) => {
        nodeIds.add(n.id)
        if (n.children) {
          n.children.forEach(child => collectIds(child))
        }
      }
      collectIds(factory)
    })
    setExpandedNodes(nodeIds)
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 0: return 'text-blue-400'
      case 1: return 'text-green-400'
      case 2: return 'text-yellow-400'
      default: return 'text-gray-300'
    }
  }

  // Filtrar nodos según búsqueda
  const filterNode = (node) => {
    if (!node) return null
    
    if (searchQuery) {
      const matchesSearch = 
        node.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.location?.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (matchesSearch) {
        return { ...node, children: node.children?.map(filterNode).filter(Boolean) }
      }
      
      if (node.children && node.children.length > 0) {
        const filteredChildren = node.children.map(filterNode).filter(Boolean)
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren }
        }
      }
      
      return null
    }
    
    return {
      ...node,
      children: node.children?.map(filterNode).filter(Boolean)
    }
  }

  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedAssetId === node.id
    const indent = level * 16
    const basePadding = 5

    return (
      <div key={node.id}>
        <div 
          className={`flex items-center gap-1 px-1 py-0.5 hover:bg-gray-800/50 rounded cursor-pointer group transition-colors ${
            isSelected ? 'bg-blue-500/20 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${basePadding + indent}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id)
            }
            handleAssetSelect(node.id)
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
            )
          ) : (
            <div className="w-3 flex-shrink-0" />
          )}
          
          <span 
            className={`flex-1 min-w-0 truncate text-xs transition-colors ${
              isSelected 
                ? 'text-blue-400 font-semibold' 
                : getLevelColor(level)
            }`}
            onClick={(e) => {
              e.stopPropagation()
              handleAssetSelect(node.id, e)
            }}
          >
            {node.code}
          </span>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderFullTree = () => {
    const factoryList = Object.keys(hierarchies).sort()
    
    return (
      <div className="space-y-0.5">
        {factoryList.map(factoryCode => {
          const factory = hierarchies[factoryCode]
          const filteredFactory = filterNode(factory)
          if (filteredFactory) {
            return renderTreeNode(filteredFactory, 0)
          }
          return null
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/jerarquia-activos')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  if (Object.keys(hierarchies).length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-4">No hay datos disponibles</p>
          <button
            onClick={() => loadHierarchies()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Recargar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Factory size={32} />
          {t.activos?.jerarquia?.title || t.activos?.jerarquia || 'Jerarquía de Activos'}
        </h1>
        <p className="text-gray-400 mt-2">
          Explorar la estructura jerárquica de activos
        </p>
      </div>

      {/* Contenido principal */}
      <div className="flex h-[calc(100vh-200px)] gap-4 flex-1 min-h-0 px-2">
        {/* Sidebar Izquierdo: Árbol de Jerarquía */}
        <div className={`flex-shrink-0 bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden flex flex-col ${
          !isMobile ? 'w-64' : 'w-full lg:w-72'
        }`}>
        {/* Header del Sidebar */}
        <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Factory size={16} />
              {t.activos?.jerarquia?.title || t.activos?.jerarquia || 'Jerarquía'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Selecciona un activo</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={expandAll}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
              title="Expandir todo"
            >
              <ChevronDown size={14} />
            </button>
            <button
              onClick={collapseAll}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
              title="Colapsar todo"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Búsqueda en Sidebar */}
        <div className="px-2 py-1.5 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Árbol de Jerarquía */}
        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : Object.keys(hierarchies).length > 0 ? (
            renderFullTree()
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Panel Derecho: Detalles del Activo */}
      {!isMobile && (
        <div className="flex-1 min-w-0">
          {selectedAssetId ? (
            <AssetDetailPanel
              assetId={selectedAssetId}
              assetDetails={assetDetails}
              loading={loadingDetails}
              onClose={() => {
                setSelectedAssetId(null)
              }}
              isMobile={false}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Info size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Selecciona un activo</p>
                <p className="text-sm mt-2">Haz click en un elemento del árbol</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modal de Detalles (Mobile) */}
      {isMobile && selectedAssetId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="h-full">
            <AssetDetailPanel
              assetId={selectedAssetId}
              assetDetails={assetDetails}
              loading={loadingDetails}
              onClose={() => {
                setSelectedAssetId(null)
              }}
              isMobile={true}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default JerarquiaActivos
