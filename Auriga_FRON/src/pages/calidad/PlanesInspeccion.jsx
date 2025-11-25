import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const PlanesInspeccion = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Planes de Inspección</h1>
      <p>Planes de inspección y ensayos (ITP)</p>
    </div>
  );
};

export default PlanesInspeccion;






