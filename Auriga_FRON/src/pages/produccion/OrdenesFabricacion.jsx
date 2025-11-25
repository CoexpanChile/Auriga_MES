import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const OrdenesFabricacion = () => {
  const { t } = useLanguage();
  
  const [filtros, setFiltros] = useState({
    linea: 'Todas las líneas',
    busqueda: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [tabActivo, setTabActivo] = useState('Estados de Orden');
  const [ordenes, setOrdenes] = useState([]);
  const [lineas, setLineas] = useState(['Todas las líneas', 'Linea 1', 'Linea 3', 'Linea 4', 'Linea 6', 'Linea 8']);

  // Datos de ejemplo basados en la imagen
  useEffect(() => {
    const ordenesEjemplo = [
      {
        id: 1,
        linea: 'Linea 1',
        numeroOF: '000010120272',
        numeroWO: 'W1010181',
        material: {
          codigo: 'EX00014091',
          descripcion: 'PE.PP NEGRO',
          especificacion: '701 X 0,78'
        },
        fechas: {
          inicio: '2025-11-24',
          fin: '2025-11-24'
        },
        cantidades: {
          planificada: 1000,
          producida: 326,
          restante: 674,
          unidad: 'KG'
        },
        progreso: 33,
        estado: {
          tipo: 'ATRASADA',
          color: 'red',
          icono: '✗'
        }
      },
      {
        id: 2,
        linea: 'Linea 3',
        numeroOF: '000010119953',
        numeroWO: 'W1010183',
        material: {
          codigo: 'EX00026134',
          descripcion: 'TRANSLUCIDO',
          especificacion: 'P.P.CLA 660 X 1.70'
        },
        fechas: {
          inicio: '2025-11-24',
          fin: '2025-11-25'
        },
        cantidades: {
          planificada: 9000,
          producida: 4911,
          restante: 4089,
          unidad: 'KG'
        },
        progreso: 55,
        estado: {
          tipo: 'EN PROCESO',
          color: 'blue',
          icono: 'ℹ'
        }
      },
      {
        id: 3,
        linea: 'Linea 4',
        numeroOF: '000010119613',
        numeroWO: 'W1010184',
        material: {
          codigo: 'EX00026361',
          descripcion: 'BR.CREMA 457 X 1.10',
          especificacion: ''
        },
        fechas: {
          inicio: '2025-11-25',
          fin: '2025-11-26'
        },
        cantidades: {
          planificada: 30000,
          producida: 3482,
          restante: 26518,
          unidad: 'KG'
        },
        progreso: 12,
        estado: {
          tipo: 'PENDIENTE',
          color: 'yellow',
          icono: 'ℹ'
        }
      }
    ];
    setOrdenes(ordenesEjemplo);
  }, []);

  const tabs = ['Estados de Orden', 'Tipos de Orden', 'Prioridades', 'Estrategias de Liberación'];

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const aplicarFiltros = () => {
    // TODO: Implementar lógica de filtrado con backend
    console.log('Aplicando filtros:', filtros);
  };

  const getEstadoColor = (estado) => {
    switch (estado.color) {
      case 'red':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'green':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600';
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    // Mantener formato YYYY-MM-DD como en la imagen
    return fecha;
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Órdenes de Fabricación
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Gestión y seguimiento de órdenes de producción por líneas
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Última sincronización</span>
          </button>
        </div>

        {/* Tabs de Filtros */}
        <div className="mb-6 flex gap-1 border-b border-gray-300 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setTabActivo(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                tabActivo === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Línea de Producción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Línea de Producción
              </label>
              <select
                value={filtros.linea}
                onChange={(e) => handleFiltroChange('linea', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
              >
                {lineas.map((linea) => (
                  <option key={linea} value={linea}>
                    {linea}
                  </option>
                ))}
              </select>
            </div>

            {/* Buscar OF/Material */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar OF/Material
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="OF, material, descripción..."
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500 pl-10"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Desde
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500 pr-10 py-2"
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Hasta
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500 pr-10 py-2"
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Botón Aplicar Filtros */}
            <div className="flex items-end">
              <button
                onClick={aplicarFiltros}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Aplicar Filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Órdenes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    LÍNEA - OF
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    MATERIAL
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    FECHAS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    CANTIDADES
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    PROGRESO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    ESTADO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {ordenes.map((orden) => (
                  <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* LÍNEA - OF */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {orden.linea}
                        </div>
                        <div className="text-sm">
                          <span className="font-mono text-gray-900 dark:text-white">
                            {orden.numeroOF}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {orden.numeroWO}
                        </div>
                      </div>
                    </td>

                    {/* MATERIAL */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                          {orden.material.codigo}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {orden.material.descripcion}
                        </div>
                        {orden.material.especificacion && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {orden.material.especificacion}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* FECHAS */}
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="text-gray-900 dark:text-white">
                          <span className="text-gray-500 dark:text-gray-400">Inicio: </span>
                          <span className="font-mono">{orden.fechas.inicio}</span>
                        </div>
                        <div className="text-gray-900 dark:text-white">
                          <span className="text-gray-500 dark:text-gray-400">Fin: </span>
                          <span className="font-mono">{orden.fechas.fin}</span>
                        </div>
                      </div>
                    </td>

                    {/* CANTIDADES */}
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="text-gray-900 dark:text-white">
                          <span className="text-gray-500 dark:text-gray-400">Planificado: </span>
                          <span className="font-semibold">{orden.cantidades.planificada.toLocaleString()} {orden.cantidades.unidad}</span>
                        </div>
                        <div className="text-gray-900 dark:text-white">
                          <span className="text-gray-500 dark:text-gray-400">Producido: </span>
                          <span className="font-semibold">{orden.cantidades.producida.toLocaleString()} {orden.cantidades.unidad}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          <span>Restante: </span>
                          <span className="font-semibold">{orden.cantidades.restante.toLocaleString()} {orden.cantidades.unidad}</span>
                        </div>
                      </div>
                    </td>

                    {/* PROGRESO */}
                    <td className="px-6 py-4">
                      <div className="w-40">
                        <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mb-2">
                          <span className="font-medium">{orden.progreso}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              orden.estado.tipo === 'ATRASADA'
                                ? 'bg-red-500'
                                : orden.estado.tipo === 'EN PROCESO'
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${orden.progreso}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* ESTADO */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border ${
                        orden.estado.tipo === 'ATRASADA' 
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                          : orden.estado.tipo === 'EN PROCESO'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                      }`}>
                        {orden.estado.tipo}
                      </span>
                    </td>

                    {/* ACCIONES */}
                    <td className="px-6 py-4">
                      {/* Columna vacía según el diseño */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenesFabricacion;
