import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import HierarchicalTree, { buildHierarchy } from '../../components/HierarchicalTree';

const ConfigPlantas = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [hierarchy, setHierarchy] = useState({});
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    ciudad: '',
    pais: '',
    activa: true,
  });

  // Cargar datos jerárquicos desde la API
  useEffect(() => {
    loadHierarchicalData();
  }, []);

  const loadHierarchicalData = async () => {
    setLoading(true);
    try {
      // TODO: Reemplazar con llamada real a la API
      // const response = await fetch('/api/assets/hierarchy');
      // const data = await response.json();
      // setAssets(data);
      
      // Por ahora, usar datos de ejemplo basados en la estructura real
      const mockAssets = [
        { id: 1, hierarchical_level: ['CXC'] },
        { id: 2, hierarchical_level: ['CXC', 'Line_08'] },
        { id: 3, hierarchical_level: ['CXC', 'Line_08', '1_Transport'] },
        { id: 4, hierarchical_level: ['CXC', 'Line_08', '1_Transport', 'TG1'] },
        { id: 5, hierarchical_level: ['CXB'] },
        { id: 6, hierarchical_level: ['CXB', 'Line_01'] },
        { id: 7, hierarchical_level: ['CXM'] },
        { id: 8, hierarchical_level: ['CXM', 'Line_01'] },
      ];
      
      setAssets(mockAssets);
      
      // Construir jerarquía
      const hierarchyData = buildHierarchy(mockAssets);
      setHierarchy(hierarchyData);
    } catch (error) {
      console.error('Error loading hierarchical data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar jerarquía por término de búsqueda
  const filteredHierarchy = useMemo(() => {
    if (!searchTerm && !selectedFactory) {
      return hierarchy;
    }

    const filterNode = (node, term, factory) => {
      if (!node) return null;

      const matchesSearch = !term || 
        node.label.toLowerCase().includes(term.toLowerCase()) ||
        node.path.some(p => p.toLowerCase().includes(term.toLowerCase()));

      const matchesFactory = !factory || 
        node.path[0] === factory;

      if (!matchesSearch && !matchesFactory) {
        // Verificar hijos
        const filteredChildren = {};
        Object.entries(node.children || {}).forEach(([key, child]) => {
          const filtered = filterNode(child, term, factory);
          if (filtered) {
            filteredChildren[key] = filtered;
          }
        });

        if (Object.keys(filteredChildren).length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      }

      // Nodo coincide, mantener con hijos filtrados
      const filteredChildren = {};
      Object.entries(node.children || {}).forEach(([key, child]) => {
        const filtered = filterNode(child, term, factory);
        if (filtered) {
          filteredChildren[key] = filtered;
        }
      });

      return {
        ...node,
        children: filteredChildren
      };
    };

    const filtered = {};
    Object.entries(hierarchy).forEach(([key, node]) => {
      const filteredNode = filterNode(node, searchTerm, selectedFactory);
      if (filteredNode) {
        filtered[key] = filteredNode;
      }
    });

    return filtered;
  }, [hierarchy, searchTerm, selectedFactory]);

  // Obtener lista de fábricas únicas
  const factories = useMemo(() => {
    const factorySet = new Set();
    assets.forEach(asset => {
      if (asset.hierarchical_level && asset.hierarchical_level.length > 0) {
        factorySet.add(asset.hierarchical_level[0]);
      }
    });
    return Array.from(factorySet).sort();
  }, [assets]);

  const handleNodeClick = (path, node) => {
    setSelectedPath(path);
    setSelectedNode(node);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implementar guardado de planta
    console.log('Guardar planta:', formData);
    setShowForm(false);
    setFormData({ nombre: '', codigo: '', direccion: '', ciudad: '', pais: '', activa: true });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t.configuracion?.plantas?.title || 'Configuración de Plantas'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t.configuracion?.plantas?.description || 'Estructura jerárquica de fábricas basada en activos'}
            </p>
          </div>
          <button
            onClick={loadHierarchicalData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm hover:shadow disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 items-center mb-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar en la jerarquía..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {factories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🔽</span>
              <select
                value={selectedFactory || ''}
                onChange={(e) => setSelectedFactory(e.target.value || null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Todas las fábricas</option>
                {factories.map(factory => (
                  <option key={factory} value={factory}>{factory}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Layout: Árbol jerárquico y detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Árbol jerárquico - 2/3 del ancho */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🏭</span>
              Estructura Jerárquica de Activos
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <span className="text-4xl mx-auto animate-spin text-blue-600 mb-4 block">🔄</span>
                <p className="text-gray-500 dark:text-gray-400">Cargando estructura jerárquica...</p>
              </div>
            ) : (
              <HierarchicalTree
                data={filteredHierarchy}
                onNodeClick={handleNodeClick}
                selectedPath={selectedPath}
              />
            )}
          </div>
        </div>

        {/* Panel de detalles - 1/3 del ancho */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detalles
            </h2>
            
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Nombre
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedNode.label}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Nivel
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedNode.level === 0 ? 'Fábrica' :
                     selectedNode.level === 1 ? 'Línea' :
                     selectedNode.level === 2 ? 'Sección' :
                     selectedNode.level === 3 ? 'Subsistema' :
                     'Componente'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Ruta Completa
                  </label>
                  <p className="text-gray-900 dark:text-white text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {selectedNode.path.join(' → ')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Cantidad de Activos
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold text-lg">
                    {selectedNode.count || 0}
                  </p>
                </div>

                {selectedNode.assets && selectedNode.assets.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Activos ({selectedNode.assets.length})
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {selectedNode.assets.map((asset, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                          <p className="text-gray-900 dark:text-white font-medium">
                            {asset.code || `Activo #${asset.id}`}
                          </p>
                          {asset.sn && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              SN: {asset.sn}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <span className="text-5xl mb-4 opacity-50 block">🏭</span>
                <p className="text-sm">Selecciona un nodo para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulario de nueva planta (oculto por ahora, se puede habilitar) */}
      {false && showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Nueva Planta
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Formulario similar al anterior */}
          </form>
        </div>
      )}
    </div>
  );
};

export default ConfigPlantas;
