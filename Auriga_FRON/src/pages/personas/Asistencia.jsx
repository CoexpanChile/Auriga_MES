import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
const Asistencia = () => {
  const { t } = useLanguage();
  return <div style={{ padding: '20px' }}><h1>Asistencia</h1><p>Control de asistencia</p></div>;
};
export default Asistencia;
