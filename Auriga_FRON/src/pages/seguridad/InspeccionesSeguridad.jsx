import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const InspeccionesSeguridad = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Inspecciones de Seguridad</h1>
      <p>Inspecciones de seguridad</p>
    </div>
  );
};

export default InspeccionesSeguridad;








