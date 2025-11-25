import { useContext } from 'react';
import { useTenantContext } from '../context/TenantContext';

/**
 * Hook para acceder al tenant global
 * 
 * IMPORTANTE: La selección de visibilidad es GLOBAL y se persiste en localStorage.
 * 
 * - Si se selecciona "CX" (país) -> Visibilidad completa
 *   hierarchical_level: null (sin filtro, muestra todas las fábricas)
 * 
 * - Si se selecciona una fábrica específica -> Visibilidad de esa fábrica
 *   hierarchical_level: [factory] donde factory es el nivel 0
 * 
 * Fábricas disponibles: CXB, CXC, CXD, CXE, CXF, CXM, EXT, FPC, FPL, FSP, MNT, RTP, ITC
 * 
 * Ejemplos:
 * - Si se selecciona "CX" -> hierarchical_level: null (visibilidad completa)
 * - Si se selecciona "CXC" -> hierarchical_level: ["CXC"] (nivel 0)
 * - Si se selecciona "CXB" -> hierarchical_level: ["CXB"] (nivel 0)
 * - Si se selecciona "CXM" -> hierarchical_level: ["CXM"] (nivel 0)
 * 
 * Esta selección se persiste en localStorage y es global para toda la aplicación.
 */
export const useTenant = () => {
  try {
    const { tenant, selectFactory, selectHierarchicalLevel } = useTenantContext();
    return { 
      tenant,
      selectFactory, // Para seleccionar solo la fábrica (nivel 0)
      selectHierarchicalLevel // Para seleccionar el hierarchical_level completo
    };
  } catch (error) {
    // Si no hay TenantProvider, retornar valores por defecto
    console.warn('useTenant used outside TenantProvider, returning default values');
    return {
      tenant: {
        country: 'Chile',
        plant: 'Planta Principal CXC',
        factory: 'CXC',
        hierarchicalLevel: ['CXC'],
        hierarchicalLevel0: 'CXC'
      },
      selectFactory: () => {},
      selectHierarchicalLevel: () => {}
    };
  }
};




