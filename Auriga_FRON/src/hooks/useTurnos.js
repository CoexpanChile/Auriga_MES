import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export const useTurnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar turnos
  const cargarTurnos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Cambiar a endpoint real cuando esté disponible
      // const data = await api.get('/api/shifts');
      // Por ahora usar datos de ejemplo
      const turnosEjemplo = [
        {
          id: 1,
          nombre: 'Día',
          hora_inicio: '07:00:00',
          hora_fin: '15:00:00',
          activo: true
        },
        {
          id: 2,
          nombre: 'Tarde',
          hora_inicio: '15:00:00',
          hora_fin: '23:00:00',
          activo: true
        },
        {
          id: 3,
          nombre: 'Noche',
          hora_inicio: '23:00:00',
          hora_fin: '07:00:00',
          activo: true
        }
      ];
      
      setTurnos(turnosEjemplo);
      
      // Seleccionar el primer turno activo si no hay uno seleccionado
      if (!turnoSeleccionado && turnosEjemplo.length > 0) {
        const turnoActivo = turnosEjemplo.find(t => t.activo) || turnosEjemplo[0];
        setTurnoSeleccionado(turnoActivo);
      }
    } catch (err) {
      console.error('Error cargando turnos:', err);
      setError('Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTurnos();
  }, []);

  // Ordenar turnos: primero activos, luego por hora de inicio
  const turnosOrdenados = [...turnos].sort((a, b) => {
    if (a.activo !== b.activo) {
      return a.activo ? -1 : 1;
    }
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });

  return {
    turnos,
    turnosOrdenados,
    turnoSeleccionado,
    setTurnoSeleccionado,
    loading,
    error,
    cargarTurnos
  };
};




