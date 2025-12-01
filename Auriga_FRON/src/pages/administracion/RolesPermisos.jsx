import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const RolesPermisos = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Roles y Permisos</h1>
      <p>Permisos por rol</p>
    </div>
  );
};

export default RolesPermisos;








