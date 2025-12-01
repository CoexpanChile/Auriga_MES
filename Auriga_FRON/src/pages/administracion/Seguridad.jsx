import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Seguridad = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Seguridad</h1>
      <p>Configuración de seguridad</p>
    </div>
  );
};

export default Seguridad;








