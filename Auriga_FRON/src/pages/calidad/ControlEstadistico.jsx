import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ControlEstadistico = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Control Estadístico</h1>
      <p>Control estadístico de procesos</p>
    </div>
  );
};

export default ControlEstadistico;








