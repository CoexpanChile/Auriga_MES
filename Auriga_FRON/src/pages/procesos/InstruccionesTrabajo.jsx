import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const InstruccionesTrabajo = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Instrucciones de Trabajo</h1>
      <p>Instrucciones de trabajo (WI, SOP, ITP)</p>
    </div>
  );
};

export default InstruccionesTrabajo;








