import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useTenant = () => {
  const auth = useAuth();
  const [tenant, setTenant] = useState({
    country: null,
    plant: null,
    factory: null
  });

  useEffect(() => {
    // Extraer información del tenant desde los datos del usuario autenticado
    if (auth?.apiUserData) {
      const userData = auth.apiUserData;
      
      // Intentar obtener información de tenant desde los permisos o datos del usuario
      // Por ahora usar valores por defecto
      setTenant({
        country: userData.country || 'Chile',
        plant: userData.plant || 'Planta Principal CXC',
        factory: userData.factory || 'CXC'
      });
    } else if (auth?.user) {
      // Fallback a datos básicos del usuario
      setTenant({
        country: 'Chile',
        plant: 'Planta Principal CXC',
        factory: 'CXC'
      });
    }
  }, [auth]);

  return { tenant };
};




