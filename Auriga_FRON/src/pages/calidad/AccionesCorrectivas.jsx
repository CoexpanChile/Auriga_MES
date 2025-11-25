import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const AccionesCorrectivas = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Acciones Correctivas</h1>
      <p>Acciones correctivas</p>
    </div>
  );
};

export default AccionesCorrectivas;






