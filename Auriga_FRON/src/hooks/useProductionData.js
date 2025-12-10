import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import httpClient from '../lib/httpClient'

/**
 * Hook para obtener la lista de líneas de producción
 * @param {string} factory - Código de la fábrica (ej: 'CXC', 'FSP')
 */
export function useProductionLines(factory) {
  return useQuery({
    queryKey: ['production-lines', factory],
    queryFn: async () => {
      try {
        const { data } = await httpClient.get('/asset/list')
        
        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ /asset/list no devolvió un array:', data)
          return []
        }
        
        // Log de la estructura raw para debugging
        if (data.length > 0) {
          const firstAsset = data[0]
          console.log('📦 Estructura raw del primer asset:', {
            id: firstAsset.id,
            code: firstAsset.code,
            parent_id: firstAsset.parent_id,
            hierarchical_level: firstAsset.hierarchical_level,
            keys: Object.keys(firstAsset)
          })
        }
        
        // Normalizar assets
        const normalizedAssets = data.map(asset => {
          const code = (asset.code || asset.Code || '').toUpperCase().trim()
          const parentId = asset.parent_id !== undefined ? asset.parent_id : (asset.ParentID || asset.parentID)
          const hierarchicalLevel = asset.hierarchical_level || asset.HierarchicalLevel || []
          
          // Extraer factory desde hierarchical_level (primer elemento del array)
          let assetFactory = ''
          if (Array.isArray(hierarchicalLevel) && hierarchicalLevel.length > 0) {
            assetFactory = hierarchicalLevel[0] || ''
          }
          
          // Si no hay factory en hierarchical_level, intentar desde el código
          if (!assetFactory && code) {
            const match = code.match(/^([A-Z]{2,4})_L\d{1,2}$/)
            if (match) assetFactory = match[1]
          }
          
          // Si hay ParentID, buscar el asset padre para obtener la factory
          if (!assetFactory && parentId !== null && parentId !== undefined) {
            const parentAsset = data.find(a => (a.id || a.ID) === parentId)
            if (parentAsset) {
              const parentLevel = parentAsset.hierarchical_level || parentAsset.HierarchicalLevel || []
              if (Array.isArray(parentLevel) && parentLevel.length > 0) {
                assetFactory = parentLevel[0]
              } else if (parentAsset.code || parentAsset.Code) {
                assetFactory = (parentAsset.code || parentAsset.Code).toUpperCase().trim()
              }
            }
          }
          
          return {
            ...asset,
            id: asset.id || asset.ID,
            code,
            line: code,
            factory: assetFactory,
            location: asset.location || asset.Location || '',
            hierarchical_level: Array.isArray(hierarchicalLevel) ? hierarchicalLevel : [],
            parentId: parentId,
            sap_code: asset.sap_code || asset.SapCode || asset.sapCode || code,
          }
        })
      
        // Filtrar solo líneas principales de producción
        // Una línea es un asset que:
        // 1. Tiene un código válido
        // 2. Tiene un ParentID (pertenece a una fábrica, no es una fábrica raíz)
        // 3. Tiene hierarchical_level con al menos 1 elemento (puede estar en nivel 1)
        const lines = normalizedAssets.filter(asset => {
          if (!asset.code) return false
          
          const code = asset.code.toUpperCase()
          const parentId = asset.parentId
          const hierarchicalLevel = asset.hierarchical_level || []
          
          // Debe tener ParentID (no es una fábrica raíz)
          if (parentId === null || parentId === undefined) return false
          
          // Verificar si es una línea por código
          const isLineByCode = (
            code.startsWith('LINE_') || 
            code.startsWith('L') ||
            code.includes('LINE') ||
            /^LINE_\d+/i.test(code) ||
            /^L\d+/i.test(code) ||
            /^[A-Z]{2,4}_L\d{1,2}$/.test(code)
          )
          
          // Verificar si es una línea por hierarchical_level (puede tener 1 o más niveles)
          // Si tiene 1 nivel, es una línea directa; si tiene 2+, es fábrica + línea
          const isLineByLevel = Array.isArray(hierarchicalLevel) && hierarchicalLevel.length >= 1
          
          // Si no cumple los criterios básicos, descartar
          if (!isLineByCode && !isLineByLevel) return false
          
          // Filtrar por fábrica si se especifica
          if (factory) {
            const assetFactory = asset.factory || hierarchicalLevel[0] || ''
            if (assetFactory && assetFactory.toUpperCase() !== factory.toUpperCase()) {
              return false
            }
          }
          
          return true
        })
      
        // Eliminar duplicados y asegurar que todas las líneas tengan los campos necesarios
        const uniqueLines = []
        const seen = new Set()
        for (const line of lines) {
          const key = `${line.factory || line.hierarchical_level?.[0] || 'UNKNOWN'}_${line.code}`
          if (!seen.has(key)) {
            seen.add(key)
            
            // Asegurar que tenga factory (usar hierarchical_level[0] si no tiene)
            if (!line.factory && line.hierarchical_level?.[0]) {
              line.factory = line.hierarchical_level[0]
            }
            
            // Asegurar que tenga sap_code (usar code si no tiene)
            if (!line.sap_code) {
              line.sap_code = line.code
            }
            
            uniqueLines.push(line)
          }
        }
        
        console.log('📊 Líneas filtradas:', uniqueLines.length, 'de', normalizedAssets.length, 'assets')
        if (uniqueLines.length > 0) {
          console.log('✅ Primeras 3 líneas encontradas:', uniqueLines.slice(0, 3).map(l => ({
            id: l.id,
            code: l.code,
            factory: l.factory,
            hierarchical_level: l.hierarchical_level,
            parentId: l.parentId
          })))
        } else {
          console.warn('⚠️ No se encontraron líneas. Analizando estructura...')
          
          // Analizar assets con ParentID
          const assetsWithParent = normalizedAssets.filter(a => a.parentId !== null && a.parentId !== undefined)
          console.warn('📋 Assets con ParentID:', assetsWithParent.length, 'de', normalizedAssets.length)
          
          if (assetsWithParent.length > 0) {
            console.warn('📋 Ejemplos de assets con ParentID:', assetsWithParent.slice(0, 5).map(a => ({
              id: a.id,
              code: a.code,
              factory: a.factory,
              hierarchical_level: a.hierarchical_level,
              parentId: a.parentId
            })))
          }
        }
        
        return uniqueLines
      } catch (error) {
        console.error('❌ Error en useProductionLines:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: true, // Siempre ejecutar, filtrar por factory dentro de la función si es necesario
  })
}

/**
 * Hook para obtener órdenes de una línea específica
 * @param {object} line - Objeto de línea con factory, code, sap_code
 * @param {boolean} fromSAP - Si debe consultar directamente a SAP
 */
export function useLineOrders(line, fromSAP = false) {
  return useQuery({
    queryKey: ['orders', line?.factory, line?.code, fromSAP],
    queryFn: async () => {
      console.log('🔄 Cargando órdenes para línea:', {
        factory: line?.factory,
        code: line?.code,
        sap_code: line?.sap_code,
        fromSAP
      })
      
      try {
        const { data } = await httpClient.post('/sap/orders', {}, {
          headers: {
            'Factory': line.factory || '',
            'ProdLine': line.code || '',
            'SapCode': line.sap_code || line.code || '',
            'SapRequest': fromSAP ? 'true' : 'false'
          }
        })
        
        const orders = Array.isArray(data) ? data : (data ? [data] : [])
        console.log('✅ Órdenes cargadas:', orders.length, 'órdenes para línea', line?.code)
        if (orders.length > 0) {
          console.log('📋 Primera orden:', {
            OrderNumber: orders[0].OrderNumber,
            ProductName: orders[0].ProductName,
            Status: orders[0].StarteddAt ? 'Con fecha inicio' : 'Sin fecha inicio'
          })
        }
        
        return orders
      } catch (error) {
        console.error('❌ Error al cargar órdenes:', {
          error: error.message,
          factory: line?.factory,
          code: line?.code,
          response: error.response?.data
        })
        throw error
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
    enabled: !!(line?.factory && line?.code),
    retry: 1, // Reintentar una vez si falla
  })
}

/**
 * Hook para obtener receta de una orden
 * @param {object} order - Orden con OrderNumber
 * @param {object} line - Línea con factory y code
 * @param {boolean} fromSAP - Si debe consultar directamente a SAP
 */
export function useOrderRecipe(order, line, fromSAP = false) {
  return useQuery({
    queryKey: ['recipe', order?.OrderNumber, line?.factory, line?.code, fromSAP],
    queryFn: async () => {
      const { data } = await httpClient.get('/sap/orderRecipe', {
        headers: {
          'Factory': line?.factory || line?.location || '',
          'ProdLine': line?.code || line?.line || '',
          'SapOrderCode': order?.OrderNumber || '',
          'SapRequest': fromSAP ? 'true' : 'false'
        }
      })
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!(order?.OrderNumber && (line?.factory || line?.location) && (line?.code || line?.line)),
  })
}

/**
 * Hook para obtener consumos de una orden
 * @param {object} order - Orden con OrderNumber
 * @param {object} line - Línea con factory y code
 * @param {string} system - Sistema (ej: 'Dosing', '' para todos)
 */
export function useOrderConsumptions(order, line, system = '') {
  return useQuery({
    queryKey: ['consumptions', order?.OrderNumber, line?.code, system],
    queryFn: async () => {
      console.log('🔄 Fetching consumptions for:', {
        orderNumber: order?.OrderNumber,
        lineCode: line?.code,
        factory: line?.factory,
        system: system
      })
      
      const { data } = await httpClient.get('/sap/orderConsump/list', {
        headers: {
          'Factory': line.factory || '',
          'ProdLine': line.code || '',
          'System': system,
          'SapOrderCode': order.OrderNumber || '',
          'SapRequest': 'false'
        }
      })
      
      console.log('✅ Consumptions loaded (raw):', data)
      // El backend puede devolver null o array
      const consumptions = data === null || data === undefined ? [] : (Array.isArray(data) ? data : [])
      // NO filtrar por ComponentSapCode vacío, porque puede ser que el backend devuelva consumos sin asignar
      console.log('✅ Consumptions processed:', consumptions.length, consumptions)
      return consumptions
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!(order?.OrderNumber && line?.factory && line?.code),
  })
}

/**
 * Hook para obtener dosificadores de una línea
 * @param {number} lineId - ID de la línea
 */
export function useLineDosers(lineId) {
  return useQuery({
    queryKey: ['dosers', lineId],
    queryFn: async () => {
      console.log('🔄 Fetching dosers for lineId:', lineId)
      const { data } = await httpClient.get('/asset/dosingbyline', {
        headers: {
          'ProdLine_ID': String(lineId)
        }
      })
      console.log('✅ Dosers loaded (raw):', data)
      // El backend puede devolver null, convertir a array vacío
      const dosers = data === null || data === undefined ? [] : (Array.isArray(data) ? data : [])
      console.log('✅ Dosers processed:', dosers)
      return dosers
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (los dosers cambian poco)
    enabled: !!lineId,
  })
}

/**
 * Hook para obtener consumos de dosificadores (hoppers)
 * @param {object} line - Línea con factory, code
 * @param {object} order - Orden con OrderNumber
 */
export function useDoserConsumptions(line, order) {
  return useQuery({
    queryKey: ['doser-consumptions', line?.factory, line?.code, order?.OrderNumber],
    queryFn: async () => {
      console.log('🔄 Fetching doser consumptions for:', line?.code, order?.OrderNumber)
      const { data } = await httpClient.get('/sap/orderConsump/list', {
        headers: {
          'Factory': line.factory,
          'ProdLine': line.code,
          'System': 'Dosing',
          'SapOrderCode': order.OrderNumber.trim(),
          'SapRequest': 'false'
        }
      })
      console.log('✅ Doser consumptions loaded:', data)
      return Array.isArray(data) ? data : []
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!(line?.factory && line?.code && order?.OrderNumber),
  })
}

/**
 * Hook para cargar datos completos de múltiples líneas (órdenes + recetas)
 * @param {Array} lines - Array de líneas
 */
export function useLinesWithData(lines) {
  // Log para debugging
  console.log('🔄 useLinesWithData llamado con:', {
    linesCount: lines?.length || 0,
    lines: lines?.slice(0, 3).map(l => ({
      code: l.code,
      factory: l.factory,
      sap_code: l.sap_code,
      id: l.id
    }))
  })
  
  return useQueries({
    queries: (lines || []).map(line => {
      const queryKey = ['line-full-data', line.factory, line.code]
      
      return {
        queryKey,
        queryFn: async () => {
          console.log(`🔄 Cargando datos para línea: ${line.code} (factory: ${line.factory})`)
          
          try {
            // Validar que la línea tenga los campos necesarios
            if (!line.factory || !line.code) {
              console.warn(`⚠️ Línea ${line.code} no tiene factory o code completo:`, {
                factory: line.factory,
                code: line.code,
                sap_code: line.sap_code
              })
              return {
                ...line,
                orders: [],
                ordersCount: 0,
                activeOrder: null,
                recipe: null
              }
            }
            
            // Cargar órdenes
            const ordersRes = await httpClient.post('/sap/orders', {}, {
              headers: {
                'Factory': line.factory || '',
                'ProdLine': line.code || '',
                'SapCode': line.sap_code || line.code || '',
                'SapRequest': 'false'
              }
            })
            
            const orders = Array.isArray(ordersRes.data) ? ordersRes.data : []
            const activeOrder = orders.find(o => o.StarteddAt && !o.FinishedAt) || orders[0]
            
            console.log(`✅ Órdenes cargadas para ${line.code}:`, orders.length, 'órdenes', activeOrder ? `(activa: ${activeOrder.OrderNumber})` : '(sin orden activa)')
            
            // Cargar receta si hay orden activa
            let recipe = null
            if (activeOrder) {
              try {
                const recipeRes = await httpClient.get('/sap/orderRecipe', {
                  headers: {
                    'Factory': line.factory || '',
                    'ProdLine': line.code || '',
                    'SapOrderCode': activeOrder.OrderNumber,
                    'SapRequest': 'false'
                  }
                })
                recipe = recipeRes.data
                console.log(`✅ Receta cargada para ${line.code}:`, recipe ? `${recipe.Components?.length || 0} componentes` : 'sin receta')
              } catch (err) {
                console.error(`❌ Error loading recipe for ${line.code}:`, err.message)
              }
            }
            
            return {
              ...line,
              orders,
              ordersCount: orders.length,
              activeOrder,
              recipe
            }
          } catch (err) {
            console.error(`❌ Error loading data for line ${line.code}:`, {
              error: err.message,
              factory: line.factory,
              code: line.code,
              sap_code: line.sap_code
            })
            return {
              ...line,
              orders: [],
              ordersCount: 0,
              activeOrder: null,
              recipe: null,
              error: err.message
            }
          }
        },
        staleTime: 2 * 60 * 1000, // 2 minutos
        refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
        enabled: !!(line?.factory && line?.code),
        retry: 1, // Reintentar solo una vez si falla
        retryDelay: 1000 // Esperar 1 segundo antes de reintentar
      }
    })
  })
}

/**
 * Mutation para asignar componente a hopper
 */
export function useAssignComponent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ line, doser, hopper, componentSapCode }) => {
      const { data } = await httpClient.get('/sap/orderConsump/add', {
        headers: {
          'Factory': line.factory,
          'ProdLine': line.code,
          'System': 'Dosing',
          'Machine': doser,
          'Part': hopper,
          'SapOrderCode': line.activeOrder.OrderNumber.trim(),
          'SapComponentCode': componentSapCode
        }
      })
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas para refetch automático
      queryClient.invalidateQueries({ queryKey: ['consumptions'] })
      queryClient.invalidateQueries({ queryKey: ['line-full-data', variables.line.factory, variables.line.code] })
    }
  })
}

/**
 * Mutation para eliminar asignación de componente
 */
export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ line, doser, hopper, componentSapCode }) => {
      const { data } = await httpClient.get('/sap/orderConsump/del', {
        headers: {
          'Factory': line.factory,
          'ProdLine': line.code,
          'System': 'Dosing',
          'Machine': doser,
          'Part': hopper,
          'SapOrderCode': line.activeOrder.OrderNumber.trim(),
          'SapComponentCode': componentSapCode
        }
      })
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['consumptions'] })
      queryClient.invalidateQueries({ queryKey: ['line-full-data', variables.line.factory, variables.line.code] })
    }
  })
}

/**
 * Mutation para actualizar fechas de orden
 */
export function useUpdateOrderDates() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ line, orderNumber, startDate, endDate }) => {
      const { data } = await httpClient.get('/sap/orders/update', {
        headers: {
          'Factory': line.factory,
          'ProdLine': line.code,
          'SapRequest': 'false',
          'OrderNumber': orderNumber,
          'StarteddAt': new Date(startDate).toISOString(),
          'FinishedAt': new Date(endDate).toISOString()
        }
      })
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidar órdenes de la línea
      queryClient.invalidateQueries({ queryKey: ['orders', variables.line.factory, variables.line.code] })
      queryClient.invalidateQueries({ queryKey: ['line-full-data', variables.line.factory, variables.line.code] })
    }
  })
}

/**
 * Mutation para sincronizar todas las líneas con SAP
 */
export function useSyncAllLines() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (lines) => {
      const results = await Promise.allSettled(
        lines.map(line =>
          httpClient.post('/sap/orders', {}, {
            headers: {
              'Factory': line.factory,
              'ProdLine': line.code,
              'SapCode': line.sap_code,
              'SapRequest': 'true'
            }
          })
        )
      )
      return results
    },
    onSuccess: () => {
      // Invalidar todas las queries de órdenes
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['line-full-data'] })
    }
  })
}

/**
 * Hook para obtener datos de dosificación desde InfluxDB por rango de fechas
 * Este es el paso 3: Buscar en InfluxDB los Dosing Unit y Dosing Hopper con cantidades
 * @param {object} line - Línea con factory, code
 * @param {string} startDate - Fecha inicio ISO
 * @param {string} endDate - Fecha fin ISO
 */
export function useInfluxDosingData(line, order, startDate, endDate) {
  return useQuery({
    queryKey: ['influx-dosing', line?.code, order?.OrderNumber, startDate, endDate],
    queryFn: async () => {
      console.log('🔄 Fetching dosing data from InfluxDB:', {
        line: line.code,
        order: order.OrderNumber,
        factory: line.factory,
        sapCode: line.sap_code,
        startDate,
        endDate
      })
      
      // Este endpoint calcula los consumos desde InfluxDB
      const { data } = await httpClient.get('/sap/orderConsump/Calculate', {
        headers: {
          'Factory': line.factory,
          'ProdLine': line.code,
          'SapCode': line.sap_code,
          'SapOrderCode': order.OrderNumber.trim(),
          'StartDate': startDate,
          'EndDate': endDate
        }
      })
      
      console.log('✅ InfluxDB dosing data:', data)
      return Array.isArray(data) ? data : []
    },
    enabled: false, // Solo ejecutar manualmente
    staleTime: 0, // Siempre fresh, no cachear
  })
}

/**
 * Mutation para guardar consumos calculados a la receta
 * Este es el paso 5: Calcular totales y almacenar
 */
export function useSaveConsumptions() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ line, order, consumptions }) => {
      console.log('💾 Saving consumptions to recipe:', {
        line: line.code,
        order: order.OrderNumber,
        consumptions: consumptions.length
      })
      
      // Guardar cada consumo
      const results = await Promise.allSettled(
        consumptions.map(consumption =>
          httpClient.get('/sap/orderConsump/add', {
            headers: {
              'Factory': line.factory,
              'ProdLine': line.code,
              'System': 'Dosing',
              'Machine': consumption.DosingUnit,
              'Part': consumption.DosingHopper,
              'SapOrderCode': order.OrderNumber.trim(),
              'SapComponentCode': consumption.ComponentSapCode
            }
          })
        )
      )
      
      console.log('✅ Consumptions saved:', results)
      return results
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: ['consumptions', variables.order.OrderNumber] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['doser-consumptions', variables.line.factory, variables.line.code] 
      })
    }
  })
}

