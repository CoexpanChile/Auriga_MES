import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LotesTrazabilidad = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>{t.produccion?.lotesTrazabilidad?.title || 'Lotes y Trazabilidad'}</h1>
      <p>{t.produccion?.lotesTrazabilidad?.description || 'Trazabilidad de lotes'}</p>
    </div>
  );
};

export default LotesTrazabilidad;






