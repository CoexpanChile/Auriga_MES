import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useTenant } from './useTenant';
import { usePermissions } from './usePermissions';

/**
 * Hook para obtener las plantas disponibles según la fábrica seleccionada
 * y los permisos del usuario
 */
export const usePlants = () => {
  const { tenant } = useTenant();
  const { permissions, checkFactoryAccess } = usePermissions();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si es visibilidad completa (CX), no hay plantas específicas
        if (tenant?.hierarchicalLevel === null || !tenant?.factory) {
          setPlants([]);
          setLoading(false);
          return;
        }

        // Obtener todos los activos desde el endpoint de assets
        const response = await api.get('/asset/list');
        
        // Manejar diferentes formatos de respuesta
        const assets = Array.isArray(response) 
          ? response 
          : (response?.data || response?.assets || []);

        // Obtener la fábrica seleccionada (nivel 0)
        const selectedFactory = tenant?.factory || tenant?.hierarchicalLevel0;
        
        // Extraer plantas únicas del nivel 1 del hierarchical_level
        // que pertenecen a la fábrica seleccionada
        const plantMap = new Map();

        if (Array.isArray(assets) && assets.length > 0) {
          assets.forEach((asset) => {
            // Obtener el código de fábrica desde hierarchical_level o Code
            let factoryCode = null;
            let plantCode = null;
            
            if (asset.hierarchical_level && Array.isArray(asset.hierarchical_level) && asset.hierarchical_level.length > 0) {
              factoryCode = asset.hierarchical_level[0];
              // El nivel 1 es la planta
              if (asset.hierarchical_level.length > 1) {
                plantCode = asset.hierarchical_level[1];
              }
            } else {
              // Si no hay hierarchical_level, usar Code y ParentID
              const code = asset.Code || asset.code;
              const parentID = asset.ParentID !== undefined ? asset.ParentID : asset.parent_id;
              
              // Si tiene padre, el padre es la fábrica y este es la planta
              if (parentID !== null && parentID !== undefined) {
                // Buscar el padre para obtener el código de fábrica
                const parent = assets.find(a => (a.ID || a.id) === parentID);
                if (parent) {
                  factoryCode = parent.Code || parent.code;
                  plantCode = code;
                }
              }
            }
            
            // Solo agregar plantas de la fábrica seleccionada
            if (factoryCode === selectedFactory && plantCode) {
              // Verificar permisos si están disponibles
              // Nota: Por ahora mostramos todas las plantas de la fábrica seleccionada
              // Los permisos se pueden agregar más adelante si es necesario
              
              if (!plantMap.has(plantCode)) {
                const location = asset.Location 
                  || asset.location 
                  || asset.location_name 
                  || asset.locationName
                  || plantCode;
                
                plantMap.set(plantCode, {
                  code: plantCode,
                  location: location,
                  displayName: `${plantCode} - ${location}`,
                  factoryCode: factoryCode
                });
              }
            }
          });
        }

        // Convertir Map a Array y ordenar alfabéticamente
        const plantsArray = Array.from(plantMap.values()).sort((a, b) => {
          return a.code.localeCompare(b.code);
        });

        setPlants(plantsArray);
      } catch (err) {
        console.error('Error al cargar plantas:', err);
        setError(err);
        setPlants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, [tenant?.factory, tenant?.hierarchicalLevel, tenant?.hierarchicalLevel0, permissions]);

  return { plants, loading, error };
};

