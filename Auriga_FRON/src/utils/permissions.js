// Utilidades para manejar permisos basados en roles, factories y departments

/**
 * Obtiene los permisos del usuario desde el servidor
 */
export const fetchUserPermissions = async () => {
  try {
    const response = await fetch('/api/auth/permissions', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return null;
  }
};

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {Object} options - Opciones de verificación
 * @param {string} options.factory - Fábrica requerida
 * @param {string} options.department - Departamento requerido
 * @param {string} options.role - Rol requerido
 * @param {string} options.group - Grupo requerido
 */
export const checkPermission = async ({ factory, department, role, group }) => {
  try {
    const params = new URLSearchParams();
    if (factory) params.append('factory', factory);
    if (department) params.append('department', department);
    if (role) params.append('role', role);
    if (group) params.append('group', group);

    const response = await fetch(`/api/auth/check-permission?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.has_permission;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Verifica permisos localmente desde los datos del usuario
 * @param {Object} userData - Datos del usuario (de checkServerAuth)
 * @param {Object} options - Opciones de verificación
 */
export const hasPermission = (userData, { factory, department, role, group }) => {
  if (!userData || !userData.organization) {
    return false;
  }

  const { organization } = userData;

  // Verificar grupo
  if (group) {
    const groups = userData.user?.groups || [];
    if (!groups.includes(group)) {
      return false;
    }
  }

  // Verificar fábrica
  if (factory) {
    const factories = organization.factories || {};
    if (!factories[factory]) {
      return false;
    }
  }

  // Verificar rol
  if (role) {
    const allRoles = organization.roles_detail || [];
    let hasRole = false;

    if (factory && department) {
      // Buscar rol específico en factory y department
      hasRole = allRoles.some(r => 
        r.factory === factory && 
        r.department === department && 
        r.role === role
      );
    } else if (factory) {
      // Buscar rol en cualquier department de la factory
      hasRole = allRoles.some(r => 
        r.factory === factory && 
        r.role === role
      );
    } else {
      // Buscar rol en cualquier factory/department
      hasRole = allRoles.some(r => r.role === role);
    }

    if (!hasRole) {
      return false;
    }
  }

  return true;
};

/**
 * Verifica si el usuario tiene acceso a una fábrica
 */
export const hasFactoryAccess = (userData, factory) => {
  if (!userData || !userData.organization) {
    return false;
  }

  const factories = userData.organization.factory_names || [];
  return factories.includes(factory);
};

/**
 * Verifica si el usuario tiene un rol específico
 */
export const hasRole = (userData, role, factory = null, department = null) => {
  if (!userData || !userData.organization) {
    return false;
  }

  const allRoles = userData.organization.roles_detail || [];

  if (factory && department) {
    return allRoles.some(r => 
      r.factory === factory && 
      r.department === department && 
      r.role === role
    );
  } else if (factory) {
    return allRoles.some(r => 
      r.factory === factory && 
      r.role === role
    );
  } else {
    return allRoles.some(r => r.role === role);
  }
};

/**
 * Verifica si el usuario está en un grupo
 */
export const hasGroup = (userData, group) => {
  if (!userData || !userData.user) {
    return false;
  }

  const groups = userData.user.groups || [];
  return groups.includes(group);
};

/**
 * Obtiene todas las fábricas a las que el usuario tiene acceso
 */
export const getUserFactories = (userData) => {
  if (!userData || !userData.organization) {
    return [];
  }

  return userData.organization.factory_names || [];
};

/**
 * Obtiene todos los roles del usuario
 */
export const getUserRoles = (userData, factory = null) => {
  if (!userData || !userData.organization) {
    return [];
  }

  const allRoles = userData.organization.roles_detail || [];

  if (factory) {
    return allRoles
      .filter(r => r.factory === factory)
      .map(r => r.role);
  }

  // Retornar roles únicos
  const uniqueRoles = new Set();
  allRoles.forEach(r => uniqueRoles.add(r.role));
  return Array.from(uniqueRoles);
};

/**
 * Obtiene todos los departamentos del usuario
 */
export const getUserDepartments = (userData, factory = null) => {
  if (!userData || !userData.organization) {
    return [];
  }

  const allRoles = userData.organization.roles_detail || [];

  if (factory) {
    const departments = new Set();
    allRoles
      .filter(r => r.factory === factory)
      .forEach(r => departments.add(r.department));
    return Array.from(departments);
  }

  const departments = new Set();
  allRoles.forEach(r => departments.add(r.department));
  return Array.from(departments);
};






