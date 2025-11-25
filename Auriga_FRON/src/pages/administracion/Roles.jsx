import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Roles = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Roles</h1>
      <p>Gestión de roles</p>
    </div>
  );
};

export default Roles;






