import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ConfigZonasHorarias = () => {
  const { t } = useLanguage();
  const [zonas, setZonas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    utcOffset: '+00:00',
    activa: true,
  });

  const zonasComunes = [
    { nombre: 'UTC', utc: '+00:00' },
    { nombre: 'GMT-5 (Colombia)', utc: '-05:00' },
    { nombre: 'GMT-6 (México)', utc: '-06:00' },
    { nombre: 'GMT-3 (Argentina)', utc: '-03:00' },
    { nombre: 'GMT-4 (Chile)', utc: '-04:00' },
    { nombre: 'GMT-5 (Perú)', utc: '-05:00' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectZona = (zona) => {
    setFormData(prev => ({
      ...prev,
      nombre: zona.nombre,
      utcOffset: zona.utc
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implementar guardado de zona horaria
    console.log('Guardar zona horaria:', formData);
    setShowForm(false);
    setFormData({ nombre: '', utcOffset: '+00:00', activa: true });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.configuracion?.zonasHorarias?.title || 'Configuración de Zonas Horarias'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.configuracion?.zonasHorarias?.description || 'Gestión de zonas horarias'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm hover:shadow"
        >
          {showForm ? t.common?.cancel || 'Cancelar' : '+ Agregar Zona Horaria'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Nueva Zona Horaria
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zonas Horarias Comunes
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {zonasComunes.map(zona => (
                  <button
                    key={zona.utc}
                    type="button"
                    onClick={() => handleSelectZona(zona)}
                    className={`p-2 rounded-md border text-sm transition ${
                      formData.nombre === zona.nombre
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {zona.nombre} ({zona.utc})
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Zona
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Offset UTC
                </label>
                <input
                  type="text"
                  name="utcOffset"
                  value={formData.utcOffset}
                  onChange={handleChange}
                  placeholder="+00:00 o -05:00"
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  required
                  pattern="[+-]\d{2}:\d{2}"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Zona Activa
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Zonas Horarias Registradas
          </h2>
          {zonas.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No hay zonas horarias registradas. Agrega una nueva zona para comenzar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Offset UTC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No hay datos disponibles
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigZonasHorarias;






