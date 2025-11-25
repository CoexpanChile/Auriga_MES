import React, { useState } from 'react';

/**
 * Componente para visualizar la jerarquía de activos basada en hierarchical_level
 * Estructura: Fábrica → Línea → Sección → Subsistema → Componente
 */
const HierarchicalTree = ({ data, onNodeClick, selectedPath = null }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));

  const toggleNode = (path) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const getIcon = (level) => {
    const icons = {
      0: '🏭', // Fábrica
      1: '📏', // Línea
      2: '🏗️', // Sección
      3: '⚙️', // Subsistema
      default: '📦' // Componente
    };
    return <span className="text-lg">{icons[level] || icons.default}</span>;
  };

  const getLevelLabel = (level) => {
    const labels = ['Fábrica', 'Línea', 'Sección', 'Subsistema', 'Componente'];
    return labels[level] || `Nivel ${level + 1}`;
  };

  const renderNode = (node, level = 0, path = '') => {
    const nodePath = path ? `${path}.${node.key}` : node.key;
    const isExpanded = expandedNodes.has(nodePath);
    const hasChildren = node.children && Object.keys(node.children).length > 0;
    const isSelected = selectedPath === nodePath;

    return (
      <div key={nodePath} className="select-none">
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition
            ${isSelected 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(nodePath);
            }
            if (onNodeClick) {
              onNodeClick(nodePath, node);
            }
          }}
        >
          {hasChildren ? (
            <span className="text-gray-500 text-sm">
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <div className="w-4" />
          )}
          
          {getIcon(level)}
          
          <span className="flex-1 font-medium text-sm text-gray-900 dark:text-white">
            {node.label}
          </span>
          
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getLevelLabel(level)}
          </span>
          
          {node.count !== undefined && (
            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
              {node.count}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 border-l border-gray-200 dark:border-gray-700">
            {Object.entries(node.children).map(([key, child]) =>
              renderNode(child, level + 1, nodePath)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <span className="text-5xl mb-4 opacity-50 block">🏭</span>
        <p>No hay datos jerárquicos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto">
      <div className="p-4">
        {Object.entries(data).map(([key, node]) =>
          renderNode(node, 0)
        )}
      </div>
    </div>
  );
};

/**
 * Función helper para construir el árbol jerárquico desde los datos de hierarchical_level
 */
export const buildHierarchy = (assets) => {
  const tree = {};

  assets.forEach(asset => {
    if (!asset.hierarchical_level || asset.hierarchical_level.length === 0) {
      return;
    }

    let current = tree;
    const path = asset.hierarchical_level;

    path.forEach((segment, index) => {
      if (!current[segment]) {
        current[segment] = {
          key: segment,
          label: segment,
          level: index,
          path: path.slice(0, index + 1),
          count: 0,
          children: {},
          assets: []
        };
      }

      current[segment].count += 1;
      
      if (index === path.length - 1) {
        // Último nivel, agregar el activo
        current[segment].assets.push(asset);
      }

      current = current[segment].children;
    });
  });

  return tree;
};

export default HierarchicalTree;

