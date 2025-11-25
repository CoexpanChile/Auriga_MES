import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ControlProceso = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Control de Proceso</h1>
      <p>Control de procesos</p>
    </div>
  );
};

export default ControlProceso;






