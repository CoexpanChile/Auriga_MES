import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ConfigCalendario = () => {
  const { t } = useLanguage();
  const [config, setConfig] = useState({
    inicioAno: new Date().getFullYear(),
    inicioSemana: 'lunes', // lunes, domingo
    diasLaborables: {
      lunes: true,
      martes: true,
      miercoles: true,
      jueves: true,
      viernes: true,
      sabado: false,
      domingo: false,
    },
    festivos: [],
  });

  const handleDayToggle = (dia) => {
    setConfig(prev => ({
      ...prev,
      diasLaborables: {
        ...prev.diasLaborables,
        [dia]: !prev.diasLaborables[dia]
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implementar guardado de configuración de calendario
    console.log('Guardar configuración de calendario:', config);
  };

  const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const diasLabels = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t.configuracion?.calendario?.title || 'Configuración de Calendario'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.configuracion?.calendario?.description || 'Configuración de calendario y días laborables'}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Año de Inicio
            </label>
            <input
              type="number"
              value={config.inicioAno}
              onChange={(e) => setConfig(prev => ({ ...prev, inicioAno: parseInt(e.target.value) }))}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
              min="2020"
              max="2100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Día de Inicio de la Semana
            </label>
            <select
              value={config.inicioSemana}
              onChange={(e) => setConfig(prev => ({ ...prev, inicioSemana: e.target.value }))}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="lunes">Lunes</option>
              <option value="domingo">Domingo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Días Laborables
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {diasSemana.map(dia => (
                <label key={dia} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600">
                  <input
                    type="checkbox"
                    checked={config.diasLaborables[dia]}
                    onChange={() => handleDayToggle(dia)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    {diasLabels[dia]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              {t.common?.cancel || 'Cancelar'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm hover:shadow"
            >
              {t.common?.save || 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigCalendario;




