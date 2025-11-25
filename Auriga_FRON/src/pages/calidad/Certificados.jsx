import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Certificados = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Certificados</h1>
      <p>Gestión de certificados</p>
    </div>
  );
};

export default Certificados;






