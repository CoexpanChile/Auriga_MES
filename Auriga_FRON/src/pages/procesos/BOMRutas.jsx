import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const BOMRutas = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>BOM y Rutas</h1>
      <p>BOM (Bill of Materials) y rutas</p>
    </div>
  );
};

export default BOMRutas;






