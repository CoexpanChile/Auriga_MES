import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Capacitaciones = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Capacitaciones</h1>
      <p>Gestión de capacitaciones</p>
    </div>
  );
};

export default Capacitaciones;








