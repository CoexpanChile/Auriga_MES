import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const OEEMetricas = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>{t.produccion?.oeeMetricas?.title || 'Métricas OEE'}</h1>
      <p>{t.produccion?.oeeMetricas?.description || 'Métricas OEE (Overall Equipment Effectiveness)'}</p>
    </div>
  );
};

export default OEEMetricas;






