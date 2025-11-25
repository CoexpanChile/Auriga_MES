import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const DatosMaestrosProcesos = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Datos Maestros de Procesos</h1>
      <p>Datos maestros de procesos</p>
    </div>
  );
};

export default DatosMaestrosProcesos;






