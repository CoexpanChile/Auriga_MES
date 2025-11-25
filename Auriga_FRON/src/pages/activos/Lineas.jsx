import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Lineas = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Líneas</h1>
      <p>Gestión de líneas de producción</p>
    </div>
  );
};

export default Lineas;






