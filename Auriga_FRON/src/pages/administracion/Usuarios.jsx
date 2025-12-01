import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Usuarios = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Usuarios</h1>
      <p>Gestión de usuarios</p>
    </div>
  );
};

export default Usuarios;








