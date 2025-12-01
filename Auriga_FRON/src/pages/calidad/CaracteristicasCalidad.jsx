import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const CaracteristicasCalidad = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Características de Calidad</h1>
      <p>Características de calidad</p>
    </div>
  );
};

export default CaracteristicasCalidad;








