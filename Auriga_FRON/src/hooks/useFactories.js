import { useState, useEffect } from 'react';
import { api } from '../lib/api';

/**
 * Hook para obtener las fábricas desde la tabla mr_assets
 * Extrae los valores únicos del nivel 0 del hierarchical_level
 * y los fusiona con el atributo location
 */
export const useFactories = () => {
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFactories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener todos los activos desde el endpoint de assets
        const response = await api.get('/asset/list');
        
        // Manejar diferentes formatos de respuesta
        const assets = Array.isArray(response) 
          ? response 
          : (response?.data || response?.assets || []);

        console.log('[useFactories] Response recibida:', response);
        console.log('[useFactories] Assets procesados:', assets);
        console.log('[useFactories] Cantidad de assets:', assets?.length || 0);

        // Extraer fábricas únicas del nivel 0 del hierarchical_level
        const factoryMap = new Map();

        // Agregar "CX - Corporate" como opción de visibilidad completa
        factoryMap.set('CX', {
          code: 'CX',
          location: 'Corporate',
          displayName: 'CX - Corporate'
        });

        // Mapeo de códigos de fábrica a locations (fallback si no vienen desde la API)
        const locationMap = {
          'CXB': 'Brasil',
          'CXC': 'Chile',
          'CXD': 'Chile',
          'CXE': 'Chile',
          'CXF': 'Chile',
          'CXM': 'Chile',
          'EXT': 'Extrusión',
          'FPC': 'FPC',
          'FPL': 'FPL',
          'FSP': 'FSP',
          'MNT': 'Mantenimiento',
          'RTP': 'RTP',
          'ITC': 'ITC'
        };

        // Procesar activos para extraer fábricas
        if (Array.isArray(assets) && assets.length > 0) {
          assets.forEach((asset) => {
            let factoryCode = null;
            
            // Intentar obtener el código de fábrica desde hierarchical_level (si existe)
            if (asset.hierarchical_level && Array.isArray(asset.hierarchical_level) && asset.hierarchical_level.length > 0) {
              factoryCode = asset.hierarchical_level[0];
            } 
            // Si no hay hierarchical_level, usar el Code directamente (para activos de nivel 0)
            // El endpoint devuelve ParentID (mayúscula) y Code (mayúscula)
            else {
              // Obtener el código - puede venir como Code o code
              const code = asset.Code || asset.code;
              // Verificar si es un activo de nivel 0 (sin padre)
              const parentID = asset.ParentID !== undefined ? asset.ParentID : asset.parent_id;
              
              // Solo considerar activos sin padre (nivel 0) como fábricas
              if (code && (parentID === null || parentID === undefined)) {
                factoryCode = code;
              }
            }
            
            console.log('[useFactories] Procesando asset:', {
              Code: asset.Code || asset.code,
              ParentID: asset.ParentID,
              parent_id: asset.parent_id,
              hierarchical_level: asset.hierarchical_level,
              factoryCode
            });
            
            // Solo agregar si no existe ya y no es CX (ya lo agregamos)
            if (factoryCode && !factoryMap.has(factoryCode) && factoryCode !== 'CX') {
              // Obtener location del activo - puede venir en diferentes campos
              const location = asset.Location 
                || asset.location 
                || asset.location_name 
                || asset.locationName
                || asset.plant_location
                || asset.plantLocation
                || asset.country
                || locationMap[factoryCode] // Usar mapeo si no hay location
                || factoryCode; // Fallback al código si no hay location
              
              console.log('[useFactories] ✅ Agregando fábrica:', factoryCode, 'location:', location);
              
              factoryMap.set(factoryCode, {
                code: factoryCode,
                location: location,
                displayName: `${factoryCode} - ${location}`
              });
            } else if (factoryCode) {
              console.log('[useFactories] ⚠️ Fábrica ya existe o es CX:', factoryCode);
            }
          });
        } else {
          console.warn('[useFactories] ⚠️ No se recibieron assets o el array está vacío');
        }

        // Convertir Map a Array y ordenar (CX primero, luego alfabéticamente)
        const factoriesArray = Array.from(factoryMap.values()).sort((a, b) => {
          // CX siempre primero
          if (a.code === 'CX') return -1;
          if (b.code === 'CX') return 1;
          // Luego ordenar alfabéticamente por código
          return a.code.localeCompare(b.code);
        });

        console.log('[useFactories] Fábricas extraídas:', factoriesArray);
        console.log('[useFactories] Total de fábricas:', factoriesArray.length);

        setFactories(factoriesArray);
      } catch (err) {
        console.error('Error al cargar fábricas:', err);
        setError(err);
        
        // Fallback a valores por defecto si hay error
        setFactories([
          { code: 'CX', location: 'Corporate', displayName: 'CX - Corporate' },
          { code: 'CXB', location: 'Brasil', displayName: 'CXB - Brasil' },
          { code: 'CXC', location: 'Chile', displayName: 'CXC - Chile' },
          { code: 'CXD', location: 'Chile', displayName: 'CXD - Chile' },
          { code: 'CXE', location: 'Chile', displayName: 'CXE - Chile' },
          { code: 'CXF', location: 'Chile', displayName: 'CXF - Chile' },
          { code: 'CXM', location: 'Chile', displayName: 'CXM - Chile' },
          { code: 'EXT', location: 'Extrusión', displayName: 'EXT - Extrusión' },
          { code: 'FPC', location: 'FPC', displayName: 'FPC - FPC' },
          { code: 'FPL', location: 'FPL', displayName: 'FPL - FPL' },
          { code: 'FSP', location: 'FSP', displayName: 'FSP - FSP' },
          { code: 'MNT', location: 'Mantenimiento', displayName: 'MNT - Mantenimiento' },
          { code: 'RTP', location: 'RTP', displayName: 'RTP - RTP' },
          { code: 'ITC', location: 'ITC', displayName: 'ITC - ITC' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFactories();
  }, []);

  return { factories, loading, error };
};

