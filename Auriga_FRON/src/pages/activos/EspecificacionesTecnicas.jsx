import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const EspecificacionesTecnicas = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Especificaciones Técnicas</h1>
      <p>Especificaciones técnicas</p>
    </div>
  );
};

export default EspecificacionesTecnicas;






