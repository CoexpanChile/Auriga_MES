import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Factory, CheckCircle, Wrench, AlertCircle, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useLanguage } from '../context/LanguageContext';
import { logout } from '../utils/auth';
import { statsService } from '../services/statsService';

const Dashboard = () => {
  const auth = useAuth();
  const { isLoading, error } = auth;
  const { permissions, checkPermission, checkFactoryAccess, checkRole, checkGroup } = usePermissions();
  const { t } = useLanguage();
  
  // Obtener fábrica seleccionada desde localStorage (sin prefijo en URL)
  const selectedFactory = useMemo(() => {
    const saved = localStorage.getItem('selectedFactory');
    // Si es 'CX' o null, significa vista global
    return saved && saved !== 'CX' ? saved : null;
  }, []);
  
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Cargar estadísticas
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true);
        const generalStats = await statsService.getGeneralStats(selectedFactory);
        setStats(generalStats);
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    
    loadStats();
  }, [selectedFactory]);


  // Secciones organizadas por categoría
  const sections = useMemo(() => {
    if (!permissions) return {};

    const availableSections = {
      general: [],
      productive: [],
      people: [],
      quality: [],
      processes: [],
      assets: [],
      safety: [],
      configuration: [],
      administration: [],
      mobile: [],
    };

    // GENERAL - Acceso para todos
    availableSections.general.push({
      path: '/dashboard',
      label: t.dashboard?.title || 'Dashboard',
      icon: '📊',
      available: true,
    });
    availableSections.general.push({
      path: '/profile',
      label: t.common?.profile || 'Perfil',
      icon: '👤',
      available: true,
    });

    // PRODUCTIVE MANAGEMENT - Gestión Productiva
    if (checkRole('Manager') || checkRole('Supervisor') || checkRole('Planner')) {
      availableSections.productive.push({
        path: '/ordenes-fabricacion',
        label: t.navigation?.orders || 'Órdenes de Fabricación',
        icon: '📦',
        available: true,
      });
      availableSections.productive.push({
        path: '/programacion',
        label: t.navigation?.scheduling || 'Programación',
        icon: '📅',
        available: true,
      });
      availableSections.productive.push({
        path: '/oee-metricas',
        label: t.navigation?.oee || 'Métricas OEE',
        icon: '📈',
        available: true,
      });
      availableSections.productive.push({
        path: '/materiales-consumos',
        label: t.navigation?.materials || 'Materiales y Consumos',
        icon: '🔧',
        available: true,
      });
      availableSections.productive.push({
        path: '/lotes-trazabilidad',
        label: t.navigation?.traceability || 'Lotes y Trazabilidad',
        icon: '🔍',
        available: true,
      });
    }

    // PEOPLE MANAGEMENT - Gestión de Personas
    if (checkRole('Manager') || checkRole('Supervisor')) {
      availableSections.people.push({
        path: '/turnos',
        label: t.navigation?.shifts || 'Turnos',
        icon: '⏰',
        available: true,
      });
      availableSections.people.push({
        path: '/empleados',
        label: t.navigation?.employees || 'Empleados',
        icon: '👥',
        available: true,
      });
      availableSections.people.push({
        path: '/turnos-asignados',
        label: t.navigation?.assignedShifts || 'Turnos Asignados',
        icon: '📋',
        available: true,
      });
      availableSections.people.push({
        path: '/horarios-trabajo',
        label: t.navigation?.workSchedules || 'Horarios de Trabajo',
        icon: '🕐',
        available: true,
      });
      availableSections.people.push({
        path: '/asistencia',
        label: t.navigation?.attendance || 'Asistencia',
        icon: '✅',
        available: true,
      });
      availableSections.people.push({
        path: '/asignaciones',
        label: t.navigation?.assignments || 'Asignaciones',
        icon: '📝',
        available: true,
      });
    }

    // QUALITY MANAGEMENT - Gestión de Calidad
    if (checkPermission({ department: 'Quality', role: 'Supervisor' }) || 
        checkPermission({ department: 'Quality', role: 'Manager' }) ||
        checkPermission({ department: 'Quality', role: 'Admin' })) {
      availableSections.quality.push({
        path: '/planes-inspeccion',
        label: t.navigation?.inspectionPlans || 'Planes de Inspección',
        icon: '🔬',
        available: true,
      });
      availableSections.quality.push({
        path: '/registros-autocontrol',
        label: t.navigation?.selfControl || 'Registros de Autocontrol',
        icon: '📋',
        available: true,
      });
      availableSections.quality.push({
        path: '/caracteristicas-calidad',
        label: t.navigation?.qualityCharacteristics || 'Características de Calidad',
        icon: '⭐',
        available: true,
      });
      availableSections.quality.push({
        path: '/defectos',
        label: t.navigation?.defects || 'Defectos',
        icon: '⚠️',
        available: true,
      });
      availableSections.quality.push({
        path: '/control-estadistico',
        label: t.navigation?.statisticalControl || 'Control Estadístico',
        icon: '📊',
        available: true,
      });
      availableSections.quality.push({
        path: '/acciones-correctivas',
        label: t.navigation?.correctiveActions || 'Acciones Correctivas',
        icon: '🔧',
        available: true,
      });
      availableSections.quality.push({
        path: '/certificados',
        label: t.navigation?.certificates || 'Certificados',
        icon: '📜',
        available: true,
      });
    }

    // PROCESS MANAGEMENT - Gestión de Procesos
    if (checkRole('Manager') || checkRole('Supervisor') || checkRole('Planner')) {
      availableSections.processes.push({
        path: '/datos-maestros-procesos',
        label: t.navigation?.masterData || 'Datos Maestros de Procesos',
        icon: '📚',
        available: true,
      });
      availableSections.processes.push({
        path: '/parametros-procesos',
        label: t.navigation?.processParameters || 'Parámetros de Procesos',
        icon: '⚙️',
        available: true,
      });
      availableSections.processes.push({
        path: '/bom-rutas',
        label: t.navigation?.bomRoutes || 'BOM y Rutas',
        icon: '🗺️',
        available: true,
      });
      availableSections.processes.push({
        path: '/instrucciones-trabajo',
        label: t.navigation?.workInstructions || 'Instrucciones de Trabajo',
        icon: '📖',
        available: true,
      });
      availableSections.processes.push({
        path: '/control-proceso',
        label: t.navigation?.processControl || 'Control de Proceso',
        icon: '🎛️',
        available: true,
      });
      availableSections.processes.push({
        path: '/procesos-automaticos',
        label: t.navigation?.automaticProcesses || 'Procesos Automáticos',
        icon: '🤖',
        available: true,
      });
    }

    // ASSET MANAGEMENT - Gestión de Activos
    if (checkRole('Manager') || checkRole('Supervisor') || checkPermission({ department: 'Maintenance' })) {
      availableSections.assets.push({
        path: '/jerarquia-activos',
        label: t.navigation?.assetHierarchy || 'Jerarquía de Activos',
        icon: '🏗️',
        available: true,
      });
      availableSections.assets.push({
        path: '/lineas',
        label: t.navigation?.lines || 'Líneas',
        icon: '📏',
        available: true,
      });
      availableSections.assets.push({
        path: '/estados-disponibilidad',
        label: t.navigation?.availabilityStates || 'Estados de Disponibilidad',
        icon: '📊',
        available: true,
      });
      availableSections.assets.push({
        path: '/especificaciones-tecnicas',
        label: t.navigation?.technicalSpecs || 'Especificaciones Técnicas',
        icon: '🔧',
        available: true,
      });
    }

    // SAFETY AND HEALTH - Seguridad y Salud
    if (checkRole('Manager') || checkRole('Supervisor')) {
      availableSections.safety.push({
        path: '/riesgos',
        label: t.navigation?.risks || 'Riesgos',
        icon: '⚠️',
        available: true,
      });
      availableSections.safety.push({
        path: '/inspecciones-seguridad',
        label: t.navigation?.safetyInspections || 'Inspecciones de Seguridad',
        icon: '🔍',
        available: true,
      });
      availableSections.safety.push({
        path: '/accidentes',
        label: t.navigation?.accidents || 'Accidentes',
        icon: '🚨',
        available: true,
      });
      availableSections.safety.push({
        path: '/capacitaciones',
        label: t.navigation?.trainings || 'Capacitaciones',
        icon: '🎓',
        available: true,
      });
      availableSections.safety.push({
        path: '/epp',
        label: t.navigation?.ppe || 'EPP',
        icon: '🛡️',
        available: true,
      });
      availableSections.safety.push({
        path: '/salud-ocupacional',
        label: t.navigation?.occupationalHealth || 'Salud Ocupacional',
        icon: '🏥',
        available: true,
      });
    }

    // CONFIGURATION - Configuración (Requiere grupo GrAuriga)
    if (checkGroup('GrAuriga')) {
      availableSections.configuration.push({
        path: '/config-empresa',
        label: t.navigation?.companyConfig || 'Configuración de Empresa',
        icon: '🏢',
        available: true,
      });
      availableSections.configuration.push({
        path: '/config-plantas',
        label: t.navigation?.plantsConfig || 'Configuración de Plantas',
        icon: '🏭',
        available: true,
      });
      availableSections.configuration.push({
        path: '/config-calendario',
        label: t.navigation?.calendarConfig || 'Configuración de Calendario',
        icon: '📅',
        available: true,
      });
      availableSections.configuration.push({
        path: '/config-turnos',
        label: t.navigation?.shiftsConfig || 'Configuración de Turnos',
        icon: '⏰',
        available: true,
      });
      availableSections.configuration.push({
        path: '/config-zonas-horarias',
        label: t.navigation?.timezonesConfig || 'Configuración de Zonas Horarias',
        icon: '🌍',
        available: true,
      });
      availableSections.configuration.push({
        path: '/config-unidades',
        label: t.navigation?.unitsConfig || 'Configuración de Unidades',
        icon: '📏',
        available: true,
      });
      availableSections.configuration.push({
        path: '/config-monedas',
        label: t.navigation?.currenciesConfig || 'Configuración de Monedas',
        icon: '💰',
        available: true,
      });
    }

    // ADMINISTRATION - Administración (Requiere grupo GrAuriga)
    if (checkGroup('GrAuriga')) {
      availableSections.administration.push({
        path: '/seguridad',
        label: t.navigation?.security || 'Seguridad',
        icon: '🔐',
        available: true,
      });
      availableSections.administration.push({
        path: '/usuarios',
        label: t.navigation?.users || 'Usuarios',
        icon: '👥',
        available: true,
      });
      availableSections.administration.push({
        path: '/roles-permisos',
        label: t.navigation?.rolesPermissions || 'Roles y Permisos',
        icon: '🔑',
        available: true,
      });
    }

    // MOBILE - Acceso móvil
    availableSections.mobile.push({
      path: '/mobile/scan',
      label: t.navigation?.scanQR || 'Escanear QR',
      icon: '📱',
      available: true,
    });

    return availableSections;
  }, [permissions, checkPermission, checkRole, checkGroup, t]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>{t.common?.loading || 'Cargando...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>{t.common?.error || 'Error'}:</strong> {error}
        </div>
        <button onClick={() => window.location.href = '/login'}>
          {t.common?.back || 'Volver'} / {t.login?.title || 'Login'}
        </button>
      </div>
    );
  }

  const categoryLabels = {
    general: t.dashboard?.categories?.general || 'General',
    productive: t.dashboard?.categories?.productive || 'Gestión Productiva',
    people: t.dashboard?.categories?.people || 'Gestión de Personas',
    quality: t.dashboard?.categories?.quality || 'Gestión de Calidad',
    processes: t.dashboard?.categories?.processes || 'Gestión de Procesos',
    assets: t.dashboard?.categories?.assets || 'Gestión de Activos',
    safety: t.dashboard?.categories?.safety || 'Seguridad y Salud',
    configuration: t.dashboard?.categories?.configuration || 'Configuración',
    administration: t.dashboard?.categories?.administration || 'Administración',
    mobile: t.dashboard?.categories?.mobile || 'Móvil',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
            {t.dashboard?.title || 'Dashboard'}
          </h1>
          {auth?.user && (
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '16px' }}>
              {t.dashboard?.welcome || 'Bienvenido'}, <strong>{auth.user.name || 'Usuario'}</strong>
            </p>
          )}
        </div>
        <button
          onClick={logout}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {t.common?.logout || 'Cerrar Sesión'}
        </button>
      </div>

      {/* Información del usuario */}
      {auth?.user && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>
                {t.dashboard?.email || 'Email'}
              </p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                {auth.user.email || 'N/A'}
              </p>
            </div>
            {permissions?.permissions?.factories && permissions.permissions.factories.length > 0 && (
              <div>
                <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>
                  {t.dashboard?.factories || 'Fábricas'}
                </p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                  {permissions.permissions.factories.slice(0, 5).join(', ')}
                  {permissions.permissions.factories.length > 5 && ` +${permissions.permissions.factories.length - 5}`}
                </p>
              </div>
            )}
            {permissions?.permissions?.roles && permissions.permissions.roles.length > 0 && (
              <div>
                <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>
                  {t.dashboard?.roles || 'Roles'}
                </p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                  {permissions.permissions.roles.join(', ')}
                </p>
              </div>
            )}
            {permissions?.user?.groups && permissions.user.groups.length > 0 && (
              <div>
                <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>
                  {t.dashboard?.groups || 'Grupos'}
                </p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                  {permissions.user.groups.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas de Producción */}
      {!loadingStats && stats && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '20px',
            marginBottom: '15px',
            color: '#333',
            paddingBottom: '10px',
            borderBottom: '2px solid #e0e0e0'
          }}>
            {t.dashboard?.statistics || 'Estadísticas'}
            {selectedFactory && ` - ${selectedFactory}`}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Factory size={24} color="#3b82f6" />
                <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {t.dashboard?.totalLines || 'Líneas Totales'}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                {stats?.productionLines?.total || 0}
              </p>
            </div>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <CheckCircle size={24} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {t.dashboard?.operationalLines || 'Líneas Operativas'}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                {stats?.productionLines?.operativas || 0}
              </p>
            </div>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Wrench size={24} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {t.dashboard?.maintenanceLines || 'En Mantenimiento'}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                {stats?.productionLines?.mantenimiento || 0}
              </p>
            </div>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <AlertCircle size={24} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {t.dashboard?.unavailableLines || 'Indisponibles'}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                {stats?.productionLines?.indisponibles || 0}
              </p>
            </div>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Users size={24} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {t.dashboard?.totalEmployees || 'Total Empleados'}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                {stats?.employees?.total || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Secciones por categoría */}
      {Object.entries(sections).map(([category, items]) => {
        if (!items || items.length === 0) return null;

        return (
          <div key={category} style={{ marginBottom: '30px' }}>
            <h2 style={{
              fontSize: '20px',
              marginBottom: '15px',
              color: '#333',
              paddingBottom: '10px',
              borderBottom: '2px solid #e0e0e0'
            }}>
              {categoryLabels[category]}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              {items.map((section) => (
                <Link
                  key={section.path}
                  to={section.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '15px',
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#333',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{section.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{section.label}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* Mensaje si no hay secciones disponibles */}
      {Object.values(sections).every(category => !category || category.length === 0) && (
        <div style={{
          background: '#fff3cd',
          padding: '20px',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            {t.dashboard?.noAccess || 'No tienes acceso a ninguna sección.'}
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
