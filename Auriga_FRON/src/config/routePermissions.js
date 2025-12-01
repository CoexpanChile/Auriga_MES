// Configuración de permisos para cada ruta
// Cada ruta puede requerir: factory, department, role, group, o cualquier combinación

export const routePermissions = {
  // Páginas Generales
  '/dashboard': {
    // Acceso general para usuarios autenticados
  },
  '/profile': {
    // Acceso general para usuarios autenticados
  },

  // Gestión Productiva
  '/ordenes-fabricacion': {
    // Puede requerir permisos específicos según factory
  },
  '/programacion': {
    // Puede requerir permisos específicos según factory
  },
  '/oee-metricas': {
    // Puede requerir permisos específicos según factory
  },
  '/materiales-consumos': {
    // Puede requerir permisos específicos según factory
  },
  '/lotes-trazabilidad': {
    // Puede requerir permisos específicos según factory
  },

  // Gestión de Personas
  '/turnos': {
    // Puede requerir rol de Supervisor o Manager
  },
  '/empleados': {
    // Puede requerir rol de Manager o Admin
  },
  '/turnos-asignados': {
    // Puede requerir rol de Supervisor
  },
  '/horarios-trabajo': {
    // Acceso general para usuarios autenticados
  },
  '/asistencia': {
    // Acceso general para usuarios autenticados
  },
  '/asignaciones': {
    // Puede requerir rol de Supervisor
  },
  '/salidas-especiales': {
    // Puede requerir rol de Manager
  },
  '/evaluaciones': {
    // Puede requerir rol de Manager
  },

  // Gestión de Calidad
  '/planes-inspeccion': {
    factory: 'CXC',
    department: 'Quality',
    role: 'Supervisor',
  },
  '/autocontrol-calidad/:planId': {
    factory: 'CXC',
    department: 'Quality',
    role: 'Supervisor',
  },
  '/registros-autocontrol': {
    factory: 'CXC',
    department: 'Quality',
    role: 'Supervisor',
  },
  '/caracteristicas-calidad': {
    factory: 'CXC',
    department: 'Quality',
    role: 'Supervisor',
  },
  '/defectos': {
    factory: 'CXC',
    department: 'Quality',
    role: 'Supervisor',
  },
  '/control-estadistico': {
    factory: 'CXC',
    department: 'Quality',
    role: 'Supervisor',
  },
  '/acciones-correctivas': {
    factory: 'CXC',
    department: 'Quality',
    role: 'Supervisor',
  },
  '/certificados': {
    factory: 'CXC',
    department: 'Quality',
    role: 'Supervisor',
  },

  // Gestión de Procesos
  '/datos-maestros-procesos': {
    // Puede requerir rol de Manager
  },
  '/parametros-procesos': {
    // Puede requerir rol de Supervisor
  },
  '/bom-rutas': {
    // Puede requerir rol de Manager
  },
  '/instrucciones-trabajo': {
    // Puede requerir rol de Supervisor
  },
  '/control-proceso': {
    // Acceso general para usuarios autenticados
  },
  '/procesos-automaticos': {
    // Puede requerir rol de Manager
  },

  // Gestión de Activos
  '/jerarquia-activos': {
    // Puede requerir rol de Supervisor
  },
  '/lineas': {
    // Acceso general para usuarios autenticados
  },
  '/lines/:lineId/assets': {
    // Acceso general para usuarios autenticados
  },
  '/estados-disponibilidad': {
    // Acceso general para usuarios autenticados
  },
  '/especificaciones-tecnicas': {
    // Puede requerir rol de Supervisor
  },

  // Seguridad y Salud
  '/riesgos': {
    // Puede requerir rol de Manager
  },
  '/inspecciones-seguridad': {
    // Puede requerir rol de Supervisor
  },
  '/accidentes': {
    // Puede requerir rol de Supervisor
  },
  '/capacitaciones': {
    // Puede requerir rol de Manager
  },
  '/epp': {
    // Acceso general para usuarios autenticados
  },
  '/salud-ocupacional': {
    // Puede requerir rol de Manager
  },

  // Configuración
  '/config-empresa': {
    group: 'GrAuriga',
  },
  '/config-plantas': {
    group: 'GrAuriga',
  },
  '/config-calendario': {
    group: 'GrAuriga',
  },
  '/config-turnos': {
    group: 'GrAuriga',
  },
  '/config-zonas-horarias': {
    group: 'GrAuriga',
  },
  '/config-unidades': {
    group: 'GrAuriga',
  },
  '/config-monedas': {
    group: 'GrAuriga',
  },

  // Administración
  '/seguridad': {
    group: 'GrAuriga',
  },
  '/usuarios': {
    group: 'GrAuriga',
  },
  '/roles-permisos': {
    group: 'GrAuriga',
  },

  // Móvil
  '/mobile/scan': {
    // Acceso general, sin restricciones
  },
};

// Función helper para obtener permisos de una ruta
export const getRoutePermissions = (path) => {
  // Buscar coincidencia exacta primero
  if (routePermissions[path]) {
    return routePermissions[path];
  }

  // Buscar coincidencia con parámetros dinámicos
  for (const [route, permissions] of Object.entries(routePermissions)) {
    const routePattern = route.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    if (regex.test(path)) {
      return permissions;
    }
  }

  // Si no hay permisos específicos, requiere autenticación básica
  return {};
};








