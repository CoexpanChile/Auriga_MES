import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
const Asignaciones = () => {
  const { t } = useLanguage();
  return <div style={{ padding: '20px' }}><h1>Asignaciones</h1><p>Asignaciones de personal</p></div>;
};
export default Asignaciones;
