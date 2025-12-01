import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Programacion = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>{t.produccion?.programacion?.title || 'Programación de Producción'}</h1>
      <p>{t.produccion?.programacion?.description || 'Programación de producción'}</p>
    </div>
  );
};

export default Programacion;








