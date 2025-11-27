import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronDown, Factory, Loader2, Home, ArrowLeft, List, Grid3x3, Info, X, Search, Filter } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { AssetDetailPanel } from '../../components/AssetDetailPanel'
import { api } from '../../lib/api'
import { useLanguage } from '../../context/LanguageContext'

function JerarquiaActivos() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  
  // Obtener fábrica seleccionada desde localStorage (sin prefijo en URL)
  const selectedFactory = useMemo(() => {
    const saved = localStorage.getItem('selectedFactory')
    // Si es 'CX' o null, significa vista global
    return saved && saved !== 'CX' ? saved : null
  }, [])
  
  const [hierarchies, setHierarchies] = useState({})
  const [currentNode, setCurrentNode] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('tree')
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [assetDetails, setAssetDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState(null)

  // Hook para responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
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

  // Construir jerarquía desde la lista de assets
  const buildHierarchy = (assets) => {
    const hierarchies = {}
    const nodeMap = new Map() // Para evitar duplicados
    
    // Agrupar assets por fábrica (primer elemento del hierarchical_level)
    assets.forEach(asset => {
      if (!asset.hierarchical_level || asset.hierarchical_level.length === 0) {
        return
      }
      
      const factoryCode = asset.hierarchical_level[0]
      
      // Crear nodo raíz de fábrica si no existe
      if (!hierarchies[factoryCode]) {
        hierarchies[factoryCode] = {
          id: factoryCode,
          code: factoryCode,
          location: factoryCode,
          hierarchical_level: [factoryCode],
          children: []
        }
        nodeMap.set(factoryCode, hierarchies[factoryCode])
      }
      
      // Construir la jerarquía anidada nivel por nivel
      let currentLevel = hierarchies[factoryCode]
      
      for (let i = 1; i < asset.hierarchical_level.length; i++) {
        const levelCode = asset.hierarchical_level[i]
        const nodePath = asset.hierarchical_level.slice(0, i + 1).join('-')
        
        // Buscar si el nodo ya existe usando el path completo como key
        let child = nodeMap.get(nodePath)
        
        if (!child) {
          // Crear nuevo nodo intermedio
          child = {
            id: nodePath,
            code: levelCode,
            location: asset.location || '',
            hierarchical_level: asset.hierarchical_level.slice(0, i + 1),
            children: []
          }
          
          // Agregar al mapa para evitar duplicados
          nodeMap.set(nodePath, child)
          
          // Agregar a children del nivel actual
          if (!currentLevel.children) {
            currentLevel.children = []
          }
          currentLevel.children.push(child)
        }
        
        currentLevel = child
      }
      
      // Agregar el asset como hoja (si no es solo un nodo intermedio)
      // Solo agregamos si el asset tiene un ID único y no es el mismo que el nodo actual
      if (asset.id && currentLevel.id !== asset.id.toString()) {
        const assetNodeId = `${currentLevel.id}-${asset.id}`
        
        // Verificar si el asset ya fue agregado como hoja
        if (!nodeMap.has(assetNodeId)) {
          const leafNode = {
            id: asset.id,
            code: asset.code || asset.name || asset.hierarchical_level[asset.hierarchical_level.length - 1],
            location: asset.location || '',
            hierarchical_level: asset.hierarchical_level,
            ...asset
          }
          
          nodeMap.set(assetNodeId, leafNode)
          
          if (!currentLevel.children) {
            currentLevel.children = []
          }
          // Verificar si no existe ya este asset como hijo
          const exists = currentLevel.children.some(c => c.id === asset.id)
          if (!exists) {
            currentLevel.children.push(leafNode)
          }
        }
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
    
    return hierarchies
  }

  const loadHierarchies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Usar /asset/list y construir la jerarquía en el cliente
      const assets = await api.get('/asset/list') || []
      
      // Filtrar por fábrica si se especifica
      let filteredAssets = assets
      if (selectedFactory) {
        filteredAssets = assets.filter(asset => {
          const factoryCode = asset.hierarchical_level?.[0]
          return factoryCode === selectedFactory || 
                 asset.location?.includes(selectedFactory) ||
                 asset.factory === selectedFactory
        })
      }
      
      // Construir jerarquía desde los assets
      const hierarchies = buildHierarchy(filteredAssets)
      
      // Si hay una fábrica seleccionada, solo incluir esa
      if (selectedFactory && hierarchies[selectedFactory]) {
        setHierarchies({ [selectedFactory]: hierarchies[selectedFactory] })
      } else {
        setHierarchies(hierarchies)
      }
      
    } catch (err) {
      console.error('Error loading hierarchies:', err)
      setError('Error de conexión')
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

  // Filtrar hijos según búsqueda y filtros
  const filteredChildren = useMemo(() => {
    if (!currentNode?.children) return []
    
    let filtered = currentNode.children
    
    if (searchQuery) {
      filtered = filtered.filter(child =>
        child.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (filterLevel !== null) {
      filtered = filtered.filter(child => 
        (child.hierarchical_level?.length || 0) === filterLevel
      )
    }
    
    return filtered
  }, [currentNode, searchQuery, filterLevel])

  const getLevelColor = (level) => {
    switch (level) {
      case 0: return 'text-blue-400'
      case 1: return 'text-green-400'
      case 2: return 'text-yellow-400'
      default: return 'text-gray-300'
    }
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
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar Izquierdo: Árbol de Jerarquía */}
      <div className={`flex-shrink-0 bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden flex flex-col ${
        !isMobile ? 'w-80' : 'w-full lg:w-96'
      }`}>
        {/* Header del Sidebar */}
        <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Factory size={16} />
              {t.activos?.jerarquia || 'Jerarquía'}
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
  )
}

export default JerarquiaActivos
