import { api } from '../lib/api'

class StatsService {
  /**
   * Obtiene estadísticas de líneas de producción
   */
  async getProductionLinesStats(factoryCode = null) {
    try {
      // No usar headers personalizados para evitar CORS - filtrar en cliente
      const response = await api.get('/asset/list')
      
      // Procesar assets para obtener estadísticas
      let assets = response || []
      
      // Filtrar por fábrica si se especifica (del lado del cliente para evitar CORS)
      if (factoryCode) {
        assets = assets.filter(asset => 
          asset.location?.includes(factoryCode) || 
          asset.hierarchical_level?.[0] === factoryCode ||
          asset.factory === factoryCode
        )
      }
      
      // Filtrar solo líneas de producción
      const productionLines = assets.filter(asset => 
        asset.hierarchical_level && 
        asset.hierarchical_level.length >= 2 &&
        asset.hierarchical_level[1]?.startsWith('L')
      )
      
      // TODO: Cuando el backend tenga endpoint de status, usar eso
      // Por ahora, contamos líneas disponibles
      return {
        total: productionLines.length,
        operativas: 0,  // Requiere endpoint de status
        mantenimiento: 0,  // Requiere endpoint de status
        indisponibles: 0,  // Requiere endpoint de status
        lines: productionLines
      }
    } catch (error) {
      console.error('Error getting production lines stats:', error)
      return {
        total: 0,
        operativas: 0,
        mantenimiento: 0,
        indisponibles: 0,
        lines: []
      }
    }
  }

  /**
   * Obtiene estadísticas de empleados
   */
  async getEmployeesStats(factoryCode = null) {
    try {
      // TODO: Implementar cuando exista endpoint de empleados
      // const response = await api.get('/labor/employees', { headers })
      
      return {
        total: 0,  // Requiere endpoint de labor
        porTurno: {
          manana: 0,
          tarde: 0,
          noche: 0
        }
      }
    } catch (error) {
      console.error('Error getting employees stats:', error)
      return {
        total: 0,
        porTurno: { manana: 0, tarde: 0, noche: 0 }
      }
    }
  }

  /**
   * Obtiene lista de activos (assets)
   */
  async getAssets(factoryCode = null) {
    try {
      // No usar headers personalizados para evitar CORS
      let assets = await api.get('/asset/list') || []
      
      // Filtrar por fábrica si se especifica (del lado del cliente)
      if (factoryCode) {
        assets = assets.filter(asset => 
          asset.location?.includes(factoryCode) || 
          asset.hierarchical_level?.[0] === factoryCode ||
          asset.factory === factoryCode
        )
      }
      
      return assets
    } catch (error) {
      console.error('Error getting assets:', error)
      return []
    }
  }

  /**
   * Obtiene estadísticas generales del sistema
   */
  async getGeneralStats(factoryCode = null) {
    try {
      const [linesStats, employeesStats] = await Promise.all([
        this.getProductionLinesStats(factoryCode),
        this.getEmployeesStats(factoryCode)
      ])

      return {
        productionLines: linesStats,
        employees: employeesStats
      }
    } catch (error) {
      console.error('Error getting general stats:', error)
      return {
        productionLines: { total: 0, operativas: 0, mantenimiento: 0, indisponibles: 0 },
        employees: { total: 0, porTurno: { manana: 0, tarde: 0, noche: 0 } }
      }
    }
  }
}

export const statsService = new StatsService()
export default statsService

