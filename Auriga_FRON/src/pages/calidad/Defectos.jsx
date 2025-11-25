import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Defectos = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Defectos</h1>
      <p>Gestión de defectos</p>
    </div>
  );
};

export default Defectos;






