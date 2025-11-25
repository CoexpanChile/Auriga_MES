import { useState, useEffect } from "react";
import { Filter, Users, RefreshCw, Package, AlertCircle, Clock, CheckCircle2, Wrench } from "lucide-react";
import { apiAsignaciones } from '../../services/apiAsignaciones';
import { useTurnos } from '../../hooks/useTurnos';
import { useTenant } from '../../hooks/useTenant';
import { api } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

const AsignacionPersonal = () => {
  const { t } = useLanguage();
  const { tenant } = useTenant();
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [lineas, setLineas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [ordenesFabricacion, setOrdenesFabricacion] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { turnoSeleccionado, turnosOrdenados } = useTurnos();

  const categorias = ["Todas", "Extrusión", "Termoformado", "Impresión", "Etiquetado"];

  // Mapeo de tipos a categorías
  const tipoCategoria = {
    'extrusion': 'Extrusión',
    'termoformado': 'Termoformado',
    'impresion': 'Impresión',
    'etiquetado': 'Etiquetado'
  };

  // ✅ FUNCIÓN AUXILIAR: Parsear fechas en UTC para evitar problemas de timezone
  const parseFechaUTC = (fecha) => {
    if (!fecha) return null;

    try {
      // Si es string "YYYY-MM-DD", crear fecha UTC directamente
      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [year, month, day] = fecha.split('-');
        return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      }

      // Si es timestamp ISO, extraer fecha y crear UTC
      if (typeof fecha === 'string' && fecha.includes('T')) {
        const datePart = fecha.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          const [year, month, day] = datePart.split('-');
          return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        }
      }

      // Fallback
      return new Date(fecha);
    } catch (e) {
      console.error('Error parseando fecha:', e, fecha);
      return null;
    }
  };

  // Cargar datos
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar líneas
      const lineasData = await apiAsignaciones.getLineas();
      setLineas(lineasData);

      // Cargar empleados
      const empleadosData = await apiAsignaciones.getEmpleados();
      setEmpleados(empleadosData);

      // Cargar asignaciones si hay turno seleccionado
      if (turnoSeleccionado) {
        const asignacionesData = await apiAsignaciones.getAsignaciones(turnoSeleccionado.id);
        setAsignaciones(asignacionesData);
      }

      // Cargar órdenes de fabricación
      try {
        const ordenesData = await api.get('/api/OF');
        console.log('📦 Órdenes de fabricación cargadas:', ordenesData);

        // El API puede retornar { data: [...] } o directamente el array
        let ordenes = ordenesData;
        if (ordenesData && ordenesData.data && Array.isArray(ordenesData.data)) {
          ordenes = ordenesData.data;
        }

        // Validar que sea un array
        if (Array.isArray(ordenes)) {
          console.log(`✅ ${ordenes.length} órdenes de fabricación disponibles`);
          setOrdenesFabricacion(ordenes);
        } else {
          console.warn('Las órdenes de fabricación no son un array:', ordenesData);
          setOrdenesFabricacion([]);
        }
      } catch (err) {
        console.warn('No se pudieron cargar las órdenes de fabricación:', err);
        setOrdenesFabricacion([]);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [turnoSeleccionado, tenant.country, tenant.plant]);

  // Obtener empleados asignados a una línea
  const getEmpleadosAsignados = (lineaId) => {
    // Validar que asignaciones sea un array
    if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
      return [];
    }

    try {
      const asignacionesLinea = asignaciones.filter(a => a && a.linea_id === lineaId);
      return asignacionesLinea.map(asig => {
        if (!asig || !asig.empleado_id) return null;

        // Validar que empleados sea un array
        if (!Array.isArray(empleados)) return null;

        const empleado = empleados.find(e => e && e.id === asig.empleado_id);
        if (empleado) {
          const nombreCompleto = `${empleado.primer_nombre || ''} ${empleado.apellido_paterno || ''}`.trim();
          return {
            nombre: nombreCompleto || 'Sin nombre',
            posicion: asig.posicion
          };
        }
        return null;
      }).filter(e => e !== null);
    } catch (error) {
      console.error('Error al obtener empleados asignados:', error);
      return [];
    }
  };

  // ✅ CORRECCIÓN: Obtener orden de fabricación con manejo UTC de fechas
  const getOrdenFabricacion = (lineaId) => {
    // Validar que ordenesFabricacion sea un array
    if (!Array.isArray(ordenesFabricacion) || ordenesFabricacion.length === 0) {
      return null;
    }

    // ✅ Obtener fecha actual en UTC (solo fecha, sin hora)
    const hoy = new Date();
    const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));

    try {
      // Buscar órdenes de esta línea
      const ordenesLinea = ordenesFabricacion.filter(of => {
        if (!of) return false;
        return of.linea_produccion_id === lineaId;
      });

      if (ordenesLinea.length === 0) return null;

      // Prioridad 1: Órdenes activas (dentro del rango)
      const ordenActiva = ordenesLinea.find(of => {
        if (!of.gstri || !of.getri) return false;

        // ✅ Parsear fechas en UTC
        const fechaInicio = parseFechaUTC(of.gstri);
        const fechaFin = parseFechaUTC(of.getri);

        if (!fechaInicio || !fechaFin) return false;
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) return false;

        // ✅ Comparar usando UTC (fecha inicio a medianoche, fecha fin al final del día)
        const inicioUTC = new Date(Date.UTC(
          fechaInicio.getUTCFullYear(),
          fechaInicio.getUTCMonth(),
          fechaInicio.getUTCDate(),
          0, 0, 0, 0
        ));

        const finUTC = new Date(Date.UTC(
          fechaFin.getUTCFullYear(),
          fechaFin.getUTCMonth(),
          fechaFin.getUTCDate(),
          23, 59, 59, 999
        ));

        return hoyUTC >= inicioUTC && hoyUTC <= finUTC;
      });

      if (ordenActiva) {
        console.log(`✅ Orden activa para línea ${lineaId}:`, ordenActiva.aufnr);
        return { ...ordenActiva, estado_orden: 'activa' };
      }

      // Prioridad 2: Órdenes atrasadas (ya pasó la fecha de fin pero con cantidad pendiente)
      const ordenAtrasada = ordenesLinea.find(of => {
        if (!of.gstri || !of.getri) return false;
        if (of.cant_res === 0) return false; // Solo si tiene cantidad pendiente

        // ✅ Parsear fecha en UTC
        const fechaFin = parseFechaUTC(of.getri);

        if (!fechaFin || isNaN(fechaFin.getTime())) return false;

        // ✅ Comparar usando UTC (fecha fin al final del día)
        const finUTC = new Date(Date.UTC(
          fechaFin.getUTCFullYear(),
          fechaFin.getUTCMonth(),
          fechaFin.getUTCDate(),
          23, 59, 59, 999
        ));

        // La fecha de fin ya pasó
        return hoyUTC > finUTC;
      });

      if (ordenAtrasada) {
        console.log(`⚠️ Orden atrasada para línea ${lineaId}:`, ordenAtrasada.aufnr);
        return { ...ordenAtrasada, estado_orden: 'atrasada' };
      }

      // Prioridad 3: Órdenes futuras (más cercanas)
      const ordenFutura = ordenesLinea
        .filter(of => {
          if (!of.gstri) return false;

          // ✅ Parsear fecha en UTC
          const fechaInicio = parseFechaUTC(of.gstri);

          if (!fechaInicio || isNaN(fechaInicio.getTime())) return false;

          // ✅ Comparar usando UTC
          const inicioUTC = new Date(Date.UTC(
            fechaInicio.getUTCFullYear(),
            fechaInicio.getUTCMonth(),
            fechaInicio.getUTCDate(),
            0, 0, 0, 0
          ));

          return inicioUTC > hoyUTC;
        })
        .sort((a, b) => {
          const fechaA = parseFechaUTC(a.gstri);
          const fechaB = parseFechaUTC(b.gstri);
          return fechaA - fechaB;
        })[0];

      if (ordenFutura) {
        console.log(`📅 Orden futura para línea ${lineaId}:`, ordenFutura.aufnr);
        return { ...ordenFutura, estado_orden: 'futura' };
      }

      return null;
    } catch (error) {
      console.error('Error al buscar orden de fabricación:', error);
      return null;
    }
  };

  // Obtener color según el estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'operativa':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'mantenimiento':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'indisponible':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-300 bg-white dark:bg-gray-800';
    }
  };

  // Obtener icono según el estado
  const getEstadoIcono = (estado) => {
    switch (estado) {
      case 'operativa':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'mantenimiento':
        return <Wrench className="w-4 h-4 text-yellow-600" />;
      case 'indisponible':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Filtrar líneas por categoría
  const lineasFiltradas = selectedCategory === "Todas"
    ? (Array.isArray(lineas) ? lineas : [])
    : (Array.isArray(lineas) ? lineas.filter(linea => linea && tipoCategoria[linea.tipo] === selectedCategory) : []);

  // Contar líneas por estado
  const estadisticas = {
    total: Array.isArray(lineas) ? lineas.length : 0,
    operativas: Array.isArray(lineas) ? lineas.filter(l => l && l.estado === 'operativa').length : 0,
    mantenimiento: Array.isArray(lineas) ? lineas.filter(l => l && l.estado === 'mantenimiento').length : 0,
    indisponibles: Array.isArray(lineas) ? lineas.filter(l => l && l.estado === 'indisponible').length : 0,
    conEmpleados: Array.isArray(lineas) ? lineas.filter(l => l && getEmpleadosAsignados(l.id).length > 0).length : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={cargarDatos}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Encabezado */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asignación de Personal</h1>
          {turnoSeleccionado && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Turno: {turnoSeleccionado.nombre} ({turnoSeleccionado.hora_inicio} - {turnoSeleccionado.hora_fin})
            </p>
          )}
        </div>
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Líneas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Operativas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.operativas}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mantenimiento</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.mantenimiento}</p>
            </div>
            <Wrench className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Indisponibles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.indisponibles}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Con Personal</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.conEmpleados}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {categorias.map((categoria) => (
          <button
            key={categoria}
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow whitespace-nowrap transition-colors ${
              selectedCategory === categoria
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => setSelectedCategory(categoria)}
          >
            <Filter size={16} />
            {categoria}
          </button>
        ))}
      </div>

      {/* Grid de líneas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {lineasFiltradas.map((linea) => {
          const empleadosAsignados = getEmpleadosAsignados(linea.id);
          const ordenFabricacion = getOrdenFabricacion(linea.id);
          const categoria = tipoCategoria[linea.tipo] || linea.tipo;

          return (
            <div
              key={linea.id}
              className={`shadow rounded-xl p-4 border-2 hover:shadow-lg transition-all ${getEstadoColor(linea.estado)}`}
            >
              {/* Encabezado */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {linea.nombre}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{categoria}</p>
                </div>
                {getEstadoIcono(linea.estado)}
              </div>

              {/* Estado */}
              <div className="mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  linea.estado === 'operativa'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                    : linea.estado === 'mantenimiento'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                }`}>
                  {linea.estado.charAt(0).toUpperCase() + linea.estado.slice(1)}
                </span>
              </div>

              {/* Empleados asignados */}
              <div className="mb-3 min-h-[60px]">
                <div className="flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Personal ({empleadosAsignados.length})
                  </span>
                </div>
                {empleadosAsignados.length > 0 ? (
                  <div className="space-y-1">
                    {empleadosAsignados.slice(0, 2).map((emp, idx) => (
                      <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        • {emp.nombre}
                      </div>
                    ))}
                    {empleadosAsignados.length > 2 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        +{empleadosAsignados.length - 2} más
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                    Sin personal asignado
                  </div>
                )}
              </div>

              {/* Orden de fabricación */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex items-center gap-1 mb-1">
                  <Package className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Orden de Fabricación
                  </span>
                </div>
                {ordenFabricacion ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <div className="text-xs font-semibold text-gray-900 dark:text-white">
                        OF: {ordenFabricacion.aufnr}
                      </div>
                      {ordenFabricacion.estado_orden === 'atrasada' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                          Atrasada
                        </span>
                      )}
                      {ordenFabricacion.estado_orden === 'futura' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                          Programada
                        </span>
                      )}
                    </div>
                    {ordenFabricacion.maktx && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {ordenFabricacion.maktx}
                      </div>
                    )}
                    {ordenFabricacion.wemng !== undefined && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Producido: {ordenFabricacion.wemng.toLocaleString()} / {ordenFabricacion.gamng.toLocaleString()}
                      </div>
                    )}
                    {ordenFabricacion.cant_res > 0 && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        Pendiente: {ordenFabricacion.cant_res.toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                    Sin órdenes
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje cuando no hay líneas */}
      {lineasFiltradas.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay líneas disponibles
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedCategory === "Todas"
              ? "No se encontraron líneas de producción"
              : `No hay líneas de ${selectedCategory}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default AsignacionPersonal;
