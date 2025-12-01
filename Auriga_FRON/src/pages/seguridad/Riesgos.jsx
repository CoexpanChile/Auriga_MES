import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Riesgos = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Riesgos</h1>
      <p>Gestión de riesgos</p>
    </div>
  );
};

export default Riesgos;








