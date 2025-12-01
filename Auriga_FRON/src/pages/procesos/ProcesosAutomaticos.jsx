import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ProcesosAutomaticos = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Procesos Automáticos</h1>
      <p>Procesos automáticos y sincronizaciones</p>
    </div>
  );
};

export default ProcesosAutomaticos;








