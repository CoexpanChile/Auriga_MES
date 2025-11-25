import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const RegistrosAutocontrol = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Registros de Autocontrol</h1>
      <p>Registros de autocontrol</p>
    </div>
  );
};

export default RegistrosAutocontrol;






