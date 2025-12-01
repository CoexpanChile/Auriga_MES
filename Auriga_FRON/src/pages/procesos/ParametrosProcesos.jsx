import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ParametrosProcesos = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Parámetros de Procesos</h1>
      <p>Parámetros de procesos</p>
    </div>
  );
};

export default ParametrosProcesos;








