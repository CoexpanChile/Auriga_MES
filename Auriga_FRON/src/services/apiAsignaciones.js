import { api } from '../lib/api';

export const apiAsignaciones = {
  /**
   * Obtener todas las líneas de producción
   */
  async getLineas() {
    try {
      const data = await api.get('/api/lines');
      // El API puede retornar { data: [...] } o directamente el array
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      console.error('Error obteniendo líneas:', error);
      return [];
    }
  },

  /**
   * Obtener todos los empleados
   */
  async getEmpleados() {
    try {
      const data = await api.get('/api/employees');
      // El API puede retornar { data: [...] } o directamente el array
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      console.error('Error obteniendo empleados:', error);
      return [];
    }
  },

  /**
   * Obtener asignaciones de personal para un turno específico
   * @param {number} turnoId - ID del turno
   */
  async getAsignaciones(turnoId) {
    try {
      const data = await api.get(`/api/assignments?shift_id=${turnoId}`);
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      console.error('Error obteniendo asignaciones:', error);
      return [];
    }
  },

  /**
   * Crear una asignación de personal
   * @param {Object} asignacion - Datos de la asignación
   */
  async createAsignacion(asignacion) {
    try {
      const data = await api.post('/api/assignments', asignacion);
      return data;
    } catch (error) {
      console.error('Error creando asignación:', error);
      throw error;
    }
  },

  /**
   * Actualizar una asignación de personal
   * @param {number} asignacionId - ID de la asignación
   * @param {Object} asignacion - Datos actualizados
   */
  async updateAsignacion(asignacionId, asignacion) {
    try {
      const data = await api.put(`/api/assignments/${asignacionId}`, asignacion);
      return data;
    } catch (error) {
      console.error('Error actualizando asignación:', error);
      throw error;
    }
  },

  /**
   * Eliminar una asignación de personal
   * @param {number} asignacionId - ID de la asignación
   */
  async deleteAsignacion(asignacionId) {
    try {
      const data = await api.delete(`/api/assignments/${asignacionId}`);
      return data;
    } catch (error) {
      console.error('Error eliminando asignación:', error);
      throw error;
    }
  },
};




