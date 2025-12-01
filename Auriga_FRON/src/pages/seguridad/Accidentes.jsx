import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Accidentes = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Accidentes</h1>
      <p>Registro de accidentes</p>
    </div>
  );
};

export default Accidentes;








