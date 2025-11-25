import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const TenantContext = createContext();

export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const auth = useAuth();
  const [tenant, setTenantState] = useState({
    country: null,
    plant: null,
    factory: null, // Fábrica CX (CXC, CXB, CXM) - nivel 0 del hierarchical_level (GLOBAL)
    hierarchicalLevel: null, // Array con el hierarchical_level completo
    hierarchicalLevel0: null // Nivel 0 = Fábrica (CXC, CXB, CXM) - GLOBAL
  });

  // Cargar del localStorage al iniciar
  useEffect(() => {
    const savedFactory = localStorage.getItem('selectedFactory');
    const savedHierarchicalLevel = localStorage.getItem('selectedHierarchicalLevel');
    
    if (savedFactory) {
      if (savedFactory === 'CX') {
        // CX = Visibilidad completa
        setTenantState(prev => ({
          ...prev,
          factory: 'CX',
          hierarchicalLevel0: null,
          hierarchicalLevel: null
        }));
      } else {
        // Fábrica específica
        setTenantState(prev => ({
          ...prev,
          factory: savedFactory,
          hierarchicalLevel0: savedFactory
        }));
      }
    }
    
    if (savedHierarchicalLevel) {
      try {
        const level = JSON.parse(savedHierarchicalLevel);
        setTenantState(prev => ({
          ...prev,
          hierarchicalLevel: level,
          hierarchicalLevel0: level && level.length > 0 ? level[0] : null,
          factory: level && level.length > 0 ? level[0] : prev.factory
        }));
      } catch (e) {
        console.error('Error parsing hierarchical level:', e);
      }
    }
  }, []);

  // Inicializar desde datos del usuario autenticado
  useEffect(() => {
    if (auth?.apiUserData) {
      const userData = auth.apiUserData;
      
      // Si no hay fábrica seleccionada aún, usar valores por defecto del usuario
      if (!tenant.factory && !localStorage.getItem('selectedFactory')) {
        // Por defecto, visibilidad completa (CX)
        setTenantState({
          country: userData.country || 'Chile',
          plant: userData.plant || 'Todas las Plantas',
          factory: 'CX',
          hierarchicalLevel: null,
          hierarchicalLevel0: null
        });
        localStorage.setItem('selectedFactory', 'CX');
        localStorage.removeItem('selectedHierarchicalLevel');
      }
    } else if (auth?.user && !tenant.factory && !localStorage.getItem('selectedFactory')) {
      // Fallback a visibilidad completa (CX)
      setTenantState({
        country: 'Chile',
        plant: 'Todas las Plantas',
        factory: 'CX',
        hierarchicalLevel: null,
        hierarchicalLevel0: null
      });
      localStorage.setItem('selectedFactory', 'CX');
      localStorage.removeItem('selectedHierarchicalLevel');
    }
  }, [auth]);

  // Función para seleccionar fábrica o país
  // - Si se selecciona "CX" = visibilidad completa (hierarchical_level null)
  // - Si se selecciona una fábrica específica (CXB, CXC, etc.) = hierarchical_level nivel 0 [factory]
  const selectFactory = (factory) => {
    let hierarchicalLevel;
    let hierarchicalLevel0;
    
    if (factory === 'CX') {
      // CX = Visibilidad completa (sin filtro de hierarchical_level)
      hierarchicalLevel = null;
      hierarchicalLevel0 = null;
    } else {
      // Fábrica específica = Nivel 0 del hierarchical_level
      hierarchicalLevel = [factory];
      hierarchicalLevel0 = factory;
    }
    
    setTenantState(prev => ({
      ...prev,
      factory,
      hierarchicalLevel0,
      hierarchicalLevel
    }));
    
    // Guardar en localStorage para persistencia global
    localStorage.setItem('selectedFactory', factory);
    if (hierarchicalLevel === null) {
      localStorage.removeItem('selectedHierarchicalLevel');
    } else {
      localStorage.setItem('selectedHierarchicalLevel', JSON.stringify(hierarchicalLevel));
    }
    
    // Emitir evento personalizado para notificar a otros componentes del cambio global
    window.dispatchEvent(new CustomEvent('factoryChanged', { 
      detail: { factory, hierarchicalLevel, hierarchicalLevel0 } 
    }));
  };

  // Función para seleccionar hierarchical_level completo
  const selectHierarchicalLevel = (hierarchicalLevel) => {
    if (!Array.isArray(hierarchicalLevel) || hierarchicalLevel.length === 0) {
      return;
    }
    
    const factory = hierarchicalLevel[0]; // El nivel 0 es la fábrica
    setTenantState(prev => ({
      ...prev,
      factory,
      hierarchicalLevel0: factory,
      hierarchicalLevel
    }));
    
    // Guardar en localStorage
    localStorage.setItem('selectedFactory', factory);
    localStorage.setItem('selectedHierarchicalLevel', JSON.stringify(hierarchicalLevel));
    
    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('factoryChanged', { 
      detail: { factory, hierarchicalLevel } 
    }));
  };

  const value = {
    tenant,
    selectFactory,
    selectHierarchicalLevel,
    setTenant: setTenantState
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

