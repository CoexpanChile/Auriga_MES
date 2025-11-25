import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const AutocontrolCalidad = () => {
  const { planId } = useParams();
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Autocontrol de Calidad</h1>
      <p>Plan ID: {planId}</p>
      <p>Autocontrol de calidad por plan</p>
    </div>
  );
};

export default AutocontrolCalidad;






