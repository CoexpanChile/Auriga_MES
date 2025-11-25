import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useLanguage } from '../context/LanguageContext';
import { logout } from '../utils/auth';
import LanguageSelector from './LanguageSelector';

const Header = () => {
  const location = useLocation();
  const auth = useAuth();
  const { checkGroup, checkRole } = usePermissions();
  const { t } = useLanguage();
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRefs = useRef({});

  // No mostrar header en login o rutas de auth
  if (location.pathname === '/login' || location.pathname.startsWith('/auth/')) {
    return null;
  }

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu) {
        Object.values(menuRefs.current).forEach(ref => {
          if (ref && !ref.contains(event.target)) {
            setActiveMenu(null);
          }
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);


  // Definir las opciones de menú nivel 0
  const menuItems = [
    {
      id: 'general',
      label: t.navigation?.general || 'General',
      icon: '🏠',
      items: [
        { path: '/dashboard', label: t.dashboard?.title || 'Dashboard', icon: '📊' },
        { path: '/profile', label: t.common?.profile || 'Perfil', icon: '👤' },
      ],
      available: true,
    },
    {
      id: 'productive',
      label: t.navigation?.productive || 'Gestión Productiva',
      icon: '📦',
      items: [
        { path: '/ordenes-fabricacion', label: t.navigation?.orders || 'Órdenes de Fabricación', icon: '📋' },
        { path: '/programacion', label: t.navigation?.scheduling || 'Programación', icon: '📅' },
        { path: '/oee-metricas', label: t.navigation?.oee || 'Métricas OEE', icon: '📈' },
        { path: '/materiales-consumos', label: t.navigation?.materials || 'Materiales y Consumos', icon: '🔧' },
        { path: '/lotes-trazabilidad', label: t.navigation?.traceability || 'Lotes y Trazabilidad', icon: '🔍' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor') || checkRole('Planner'),
    },
    {
      id: 'people',
      label: t.navigation?.people || 'Gestión de Personas',
      icon: '👥',
      items: [
        { path: '/turnos', label: t.navigation?.shifts || 'Turnos', icon: '⏰' },
        { path: '/empleados', label: t.navigation?.employees || 'Empleados', icon: '👤' },
        { path: '/turnos-asignados', label: t.navigation?.assignedShifts || 'Turnos Asignados', icon: '📋' },
        { path: '/horarios-trabajo', label: t.navigation?.workSchedules || 'Horarios de Trabajo', icon: '🕐' },
        { path: '/asistencia', label: t.navigation?.attendance || 'Asistencia', icon: '✅' },
        { path: '/asignaciones', label: t.navigation?.assignments || 'Asignaciones', icon: '📝' },
        { path: '/asignacion-personal', label: t.navigation?.personalAssignment || 'Asignación de Personal', icon: '👥' },
        { path: '/salidas-especiales', label: t.navigation?.specialExits || 'Salidas Especiales', icon: '🚪' },
        { path: '/evaluaciones', label: t.navigation?.evaluations || 'Evaluaciones', icon: '⭐' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor'),
    },
    {
      id: 'quality',
      label: t.navigation?.quality || 'Gestión de Calidad',
      icon: '✅',
      items: [
        { path: '/planes-inspeccion', label: t.navigation?.inspectionPlans || 'Planes de Inspección', icon: '🔬' },
        { path: '/registros-autocontrol', label: t.navigation?.selfControl || 'Registros de Autocontrol', icon: '📋' },
        { path: '/caracteristicas-calidad', label: t.navigation?.qualityCharacteristics || 'Características de Calidad', icon: '⭐' },
        { path: '/defectos', label: t.navigation?.defects || 'Defectos', icon: '⚠️' },
        { path: '/control-estadistico', label: t.navigation?.statisticalControl || 'Control Estadístico', icon: '📊' },
        { path: '/acciones-correctivas', label: t.navigation?.correctiveActions || 'Acciones Correctivas', icon: '🔧' },
        { path: '/certificados', label: t.navigation?.certificates || 'Certificados', icon: '📜' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor'),
    },
    {
      id: 'processes',
      label: t.navigation?.processes || 'Gestión de Procesos',
      icon: '⚙️',
      items: [
        { path: '/datos-maestros-procesos', label: t.navigation?.masterData || 'Datos Maestros', icon: '📚' },
        { path: '/parametros-procesos', label: t.navigation?.processParameters || 'Parámetros de Procesos', icon: '⚙️' },
        { path: '/bom-rutas', label: t.navigation?.bomRoutes || 'BOM y Rutas', icon: '🗺️' },
        { path: '/instrucciones-trabajo', label: t.navigation?.workInstructions || 'Instrucciones de Trabajo', icon: '📖' },
        { path: '/control-proceso', label: t.navigation?.processControl || 'Control de Proceso', icon: '🎛️' },
        { path: '/procesos-automaticos', label: t.navigation?.automaticProcesses || 'Procesos Automáticos', icon: '🤖' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor') || checkRole('Planner'),
    },
    {
      id: 'assets',
      label: t.navigation?.assets || 'Gestión de Activos',
      icon: '🏭',
      items: [
        { path: '/jerarquia-activos', label: t.navigation?.assetHierarchy || 'Jerarquía de Activos', icon: '🏗️' },
        { path: '/lineas', label: t.navigation?.lines || 'Líneas', icon: '📏' },
        { path: '/estados-disponibilidad', label: t.navigation?.availabilityStates || 'Estados de Disponibilidad', icon: '📊' },
        { path: '/especificaciones-tecnicas', label: t.navigation?.technicalSpecs || 'Especificaciones Técnicas', icon: '🔧' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor'),
    },
    {
      id: 'safety',
      label: t.navigation?.safety || 'Seguridad y Salud',
      icon: '🛡️',
      items: [
        { path: '/riesgos', label: t.navigation?.risks || 'Riesgos', icon: '⚠️' },
        { path: '/inspecciones-seguridad', label: t.navigation?.safetyInspections || 'Inspecciones de Seguridad', icon: '🔍' },
        { path: '/accidentes', label: t.navigation?.accidents || 'Accidentes', icon: '🚨' },
        { path: '/capacitaciones', label: t.navigation?.trainings || 'Capacitaciones', icon: '🎓' },
        { path: '/epp', label: t.navigation?.ppe || 'EPP', icon: '🛡️' },
        { path: '/salud-ocupacional', label: t.navigation?.occupationalHealth || 'Salud Ocupacional', icon: '🏥' },
      ],
      available: checkRole('Manager') || checkRole('Supervisor'),
    },
    {
      id: 'configuration',
      label: t.navigation?.configuration || 'Configuración',
      icon: '⚙️',
      items: [
        { path: '/config-empresa', label: t.navigation?.companyConfig || 'Configuración de Empresa', icon: '🏢' },
        { path: '/config-plantas', label: t.navigation?.plantsConfig || 'Configuración de Plantas', icon: '🏭' },
        { path: '/config-calendario', label: t.navigation?.calendarConfig || 'Configuración de Calendario', icon: '📅' },
        { path: '/config-turnos', label: t.navigation?.shiftsConfig || 'Configuración de Turnos', icon: '⏰' },
        { path: '/config-zonas-horarias', label: t.navigation?.timezonesConfig || 'Zonas Horarias', icon: '🌍' },
        { path: '/config-unidades', label: t.navigation?.unitsConfig || 'Unidades', icon: '📏' },
        { path: '/config-monedas', label: t.navigation?.currenciesConfig || 'Monedas', icon: '💰' },
      ],
      available: checkGroup('GrAuriga'),
    },
    {
      id: 'administration',
      label: t.navigation?.administration || 'Administración',
      icon: '👔',
      items: [
        { path: '/seguridad', label: t.navigation?.security || 'Seguridad', icon: '🔐' },
        { path: '/usuarios', label: t.navigation?.users || 'Usuarios', icon: '👥' },
        { path: '/roles', label: t.navigation?.roles || 'Roles', icon: '👔' },
        { path: '/roles-permisos', label: t.navigation?.rolesPermissions || 'Roles y Permisos', icon: '🔑' },
      ],
      available: checkGroup('GrAuriga'),
    },
    {
      id: 'mobile',
      label: t.navigation?.mobile || 'Móvil',
      icon: '📱',
      items: [
        { path: '/mobile/scan', label: t.navigation?.scanQR || 'Escanear QR', icon: '📱' },
      ],
      available: true,
    },
  ];

  // Filtrar menús disponibles
  const availableMenus = menuItems.filter(menu => menu.available);

  const toggleMenu = (menuId) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isMenuActive = (menu) => {
    return menu.items.some(item => isActivePath(item.path));
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
              <span className="text-2xl">🏭</span>
              <span>Auriga MES</span>
            </Link>
          </div>

          {/* Menú principal nivel 0 */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {availableMenus.map((menu) => {
              const isActive = isMenuActive(menu);
              return (
                <div
                  key={menu.id}
                  ref={el => menuRefs.current[menu.id] = el}
                  className="relative"
                >
                  <button
                    onClick={() => toggleMenu(menu.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition
                      ${isActive || activeMenu === menu.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <span>{menu.icon}</span>
                    <span className="font-medium text-sm">{menu.label}</span>
                    <span className={`text-xs transition-transform ${activeMenu === menu.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  {activeMenu === menu.id && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      {menu.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setActiveMenu(null)}
                          className={`
                            flex items-center gap-3 px-4 py-2 text-sm transition
                            ${isActivePath(item.path)
                              ? 'bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User menu y acciones */}
          <div className="flex items-center gap-4">
            <LanguageSelector />
            
            {(auth?.user || auth?.apiUserData) && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {auth?.user?.name || auth?.apiUserData?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {auth?.user?.email || auth?.apiUserData?.email || ''}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm font-medium"
                >
                  {t.common?.logout || 'Cerrar Sesión'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Menú móvil */}
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveMenu(activeMenu === 'mobile-menu' ? null : 'mobile-menu')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300"
            >
              <span>☰</span>
              <span className="font-medium">Menú</span>
            </button>
            
            {activeMenu === 'mobile-menu' && (
              <div className="absolute left-0 right-0 top-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {availableMenus.map((menu) => (
                  <div key={menu.id} className="border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => toggleMenu(menu.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <span>{menu.icon}</span>
                        <span className="font-medium">{menu.label}</span>
                      </div>
                      <span className={`text-xs transition-transform ${activeMenu === menu.id ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    
                    {activeMenu === menu.id && (
                      <div className="bg-gray-50 dark:bg-gray-900">
                        {menu.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setActiveMenu(null)}
                            className={`
                              flex items-center gap-3 px-8 py-2 text-sm
                              ${isActivePath(item.path)
                                ? 'bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                                : 'text-gray-700 dark:text-gray-300'
                              }
                            `}
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

