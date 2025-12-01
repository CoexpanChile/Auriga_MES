import { useState, useEffect } from 'react';
import { fetchUserPermissions, hasPermission, hasFactoryAccess, hasRole, hasGroup } from '../utils/permissions';
import { checkServerAuth } from '../utils/auth';

/**
 * Hook para manejar permisos del usuario
 */
export const usePermissions = () => {
  const [permissions, setPermissions] = useState({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        // Primero verificar autenticación
        const auth = await checkServerAuth();
        if (!auth.authenticated) {
          setPermissions({
            data: null,
            isLoading: false,
            error: 'Not authenticated',
          });
          return;
        }

        // Obtener permisos
        const permsData = await fetchUserPermissions();
        setPermissions({
          data: permsData,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions({
          data: null,
          isLoading: false,
          error: error.message,
        });
      }
    };

    loadPermissions();
  }, []);

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const checkPermission = (options) => {
    if (!permissions.data) {
      return false;
    }
    return hasPermission(permissions.data, options);
  };

  /**
   * Verifica acceso a una fábrica
   */
  const checkFactoryAccess = (factory) => {
    if (!permissions.data) {
      return false;
    }
    return hasFactoryAccess(permissions.data, factory);
  };

  /**
   * Verifica si tiene un rol
   */
  const checkRole = (role, factory = null, department = null) => {
    if (!permissions.data) {
      return false;
    }
    return hasRole(permissions.data, role, factory, department);
  };

  /**
   * Verifica si está en un grupo
   */
  const checkGroup = (group) => {
    if (!permissions.data) {
      return false;
    }
    return hasGroup(permissions.data, group);
  };

  return {
    permissions: permissions.data,
    isLoading: permissions.isLoading,
    error: permissions.error,
    checkPermission,
    checkFactoryAccess,
    checkRole,
    checkGroup,
  };
};








