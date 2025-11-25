import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = () => {
  const location = useLocation();
  const { checkRole, checkGroup } = usePermissions();
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState({
    productive: true,
    assets: true,
    people: false,
    processes: false,
    quality: false,
    safety: false,
    config: false,
    system: false,
  });

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      id: 'productive',
      label: 'Gestión Productiva',
      icon: '📦',
      expanded: expandedSections.productive,
      items: [
        { path: '/ordenes-fabricacion', label: 'Órdenes de Fabricación', icon: '📁' },
        { path: '/programacion', label: 'Programación', icon: '📅' },
        { path: '/oee-metricas', label: 'OEE y Métricas', icon: '📈' },
        { path: '/materiales-consumos', label: 'Materiales y Consumos', icon: '🔧' },
        { path: '/lotes-trazabilidad', label: 'Lotes y Trazabilidad', icon: '🔍' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor') || checkRole('Planner'),
    },
    {
      id: 'people',
      label: 'Gestión de Personas',
      icon: '👥',
      expanded: expandedSections.people,
      items: [
        { path: '/turnos', label: 'Turnos', icon: '⏰' },
        { path: '/empleados', label: 'Empleados', icon: '👤' },
        { path: '/asignacion-personal', label: 'Asignación de Personal', icon: '📝' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor'),
    },
    {
      id: 'processes',
      label: 'Gestión de Procesos',
      icon: '⚙️',
      expanded: expandedSections.processes,
      items: [
        { path: '/datos-maestros-procesos', label: 'Datos Maestros', icon: '📚' },
        { path: '/parametros-procesos', label: 'Parámetros de Procesos', icon: '⚙️' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor') || checkRole('Planner'),
    },
    {
      id: 'quality',
      label: 'Gestión de Calidad',
      icon: '✅',
      expanded: expandedSections.quality,
      items: [
        { path: '/planes-inspeccion', label: 'Planes de Inspección', icon: '🔬' },
        { path: '/defectos', label: 'Defectos', icon: '⚠️' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor'),
    },
    {
      id: 'assets',
      label: 'Gestión de Activos',
      icon: '🏭',
      expanded: expandedSections.assets,
      items: [
        { path: '/jerarquia-activos', label: 'Jerarquía de Activos', icon: '🏗️' },
        { path: '/lineas', label: 'Líneas de Producción', icon: '📏' },
        { path: '/estados-disponibilidad', label: 'Estados y Disponibilidad', icon: '📊' },
        { path: '/especificaciones-tecnicas', label: 'Especificaciones Técnicas', icon: '🔧' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor'),
    },
    {
      id: 'safety',
      label: 'Prevención y Seguridad',
      icon: '🛡️',
      expanded: expandedSections.safety,
      items: [
        { path: '/riesgos', label: 'Riesgos', icon: '⚠️' },
        { path: '/inspecciones-seguridad', label: 'Inspecciones de Seguridad', icon: '🔍' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor'),
    },
    {
      id: 'config',
      label: 'Configuración General',
      icon: '⚙️',
      expanded: expandedSections.config,
      items: [
        { path: '/config-empresa', label: 'Configuración de Empresa', icon: '🏢' },
        { path: '/config-plantas', label: 'Configuración de Plantas', icon: '🏭' },
      ],
      available: checkGroup('GrAuriga'),
    },
    {
      id: 'system',
      label: 'Sistema',
      icon: '💻',
      expanded: expandedSections.system,
      items: [
        { path: '/usuarios', label: 'Usuarios', icon: '👥' },
        { path: '/roles', label: 'Roles', icon: '👔' },
      ],
      available: checkGroup('GrAuriga'),
    },
  ];

  const filteredMenuItems = menuItems.filter(item => item.available);

  return (
    <aside className="w-64 bg-gray-800 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        {/* Logo */}
        <div className="mb-6">
          <h1 className="text-xl font-bold">MES</h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {filteredMenuItems.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  expandedSections[section.id]
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{section.icon}</span>
                  <span className="text-sm font-medium">{section.label}</span>
                </div>
                <span
                  className={`transform transition-transform ${
                    expandedSections[section.id] ? 'rotate-90' : ''
                  }`}
                >
                  ▶
                </span>
              </button>

              {expandedSections[section.id] && (
                <div className="ml-4 mt-1 space-y-1">
                  {section.items.map((item) => {
                    const isActive = isActivePath(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

