import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const ConfiguracionGeneral = () => {
  const location = useLocation();
  const { t } = useLanguage();

  // Determinar qué tipo de configuración según la ruta
  const getConfigType = () => {
    const path = location.pathname;
    if (path.includes('empresa')) return 'empresa';
    if (path.includes('plantas')) return 'plantas';
    if (path.includes('calendario')) return 'calendario';
    if (path.includes('turnos')) return 'turnos';
    if (path.includes('zonas-horarias')) return 'zonasHorarias';
    if (path.includes('unidades')) return 'unidades';
    if (path.includes('monedas')) return 'monedas';
    return 'general';
  };

  const configType = getConfigType();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Configuración {configType}</h1>
      <p>Tipo de configuración: {configType}</p>
    </div>
  );
};

export default ConfiguracionGeneral;






