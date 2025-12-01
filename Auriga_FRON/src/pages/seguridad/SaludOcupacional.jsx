import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const SaludOcupacional = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Salud Ocupacional</h1>
      <p>Salud ocupacional</p>
    </div>
  );
};

export default SaludOcupacional;








