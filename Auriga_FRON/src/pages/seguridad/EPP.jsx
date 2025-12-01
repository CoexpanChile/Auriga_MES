import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const EPP = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>EPP</h1>
      <p>Equipos de protección personal</p>
    </div>
  );
};

export default EPP;








