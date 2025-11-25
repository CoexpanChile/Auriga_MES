import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
const Empleados = () => {
  const { t } = useLanguage();
  return <div style={{ padding: '20px' }}><h1>Empleados</h1><p>Gestión de empleados</p></div>;
};
export default Empleados;
