import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const EstadosDisponibilidad = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Estados de Disponibilidad</h1>
      <p>Estados de disponibilidad</p>
    </div>
  );
};

export default EstadosDisponibilidad;






