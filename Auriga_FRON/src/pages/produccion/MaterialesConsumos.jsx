import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const MaterialesConsumos = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>{t.produccion?.materialesConsumos?.title || 'Materiales y Consumos'}</h1>
      <p>{t.produccion?.materialesConsumos?.description || 'Control de materiales y consumos'}</p>
    </div>
  );
};

export default MaterialesConsumos;






