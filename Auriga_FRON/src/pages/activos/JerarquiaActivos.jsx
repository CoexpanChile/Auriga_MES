import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const JerarquiaActivos = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Jerarquía de Activos</h1>
      <p>Jerarquía de activos</p>
    </div>
  );
};

export default JerarquiaActivos;






