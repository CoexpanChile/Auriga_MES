import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ConfigMonedas = () => {
  const { t } = useLanguage();
  const [monedas, setMonedas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '', // USD, EUR, COP, etc.
    simbolo: '',
    predeterminada: false,
    activa: true,
  });

  const monedasComunes = [
    { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$' },
    { codigo: 'EUR', nombre: 'Euro', simbolo: '€' },
    { codigo: 'COP', nombre: 'Peso Colombiano', simbolo: '$' },
    { codigo: 'MXN', nombre: 'Peso Mexicano', simbolo: '$' },
    { codigo: 'ARS', nombre: 'Peso Argentino', simbolo: '$' },
    { codigo: 'CLP', nombre: 'Peso Chileno', simbolo: '$' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectMoneda = (moneda) => {
    setFormData(prev => ({
      ...prev,
      nombre: moneda.nombre,
      codigo: moneda.codigo,
      simbolo: moneda.simbolo
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implementar guardado de moneda
    console.log('Guardar moneda:', formData);
    setShowForm(false);
    setFormData({ nombre: '', codigo: '', simbolo: '', predeterminada: false, activa: true });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.configuracion?.monedas?.title || 'Configuración de Monedas'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.configuracion?.monedas?.description || 'Gestión de monedas y tasas de cambio'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm hover:shadow"
        >
          {showForm ? t.common?.cancel || 'Cancelar' : '+ Agregar Moneda'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Nueva Moneda
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monedas Comunes
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {monedasComunes.map(moneda => (
                  <button
                    key={moneda.codigo}
                    type="button"
                    onClick={() => handleSelectMoneda(moneda)}
                    className={`p-2 rounded-md border text-sm transition ${
                      formData.codigo === moneda.codigo
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {moneda.codigo} - {moneda.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Moneda
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
                  Código ISO
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  placeholder="USD, EUR, COP..."
                  maxLength="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Símbolo
                </label>
                <input
                  type="text"
                  name="simbolo"
                  value={formData.simbolo}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  placeholder="$"
                  maxLength="3"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="predeterminada"
                    checked={formData.predeterminada}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Moneda Predeterminada
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Moneda Activa
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
            Monedas Registradas
          </h2>
          {monedas.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No hay monedas registradas. Agrega una nueva moneda para comenzar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Símbolo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Predeterminada
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
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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

export default ConfigMonedas;






