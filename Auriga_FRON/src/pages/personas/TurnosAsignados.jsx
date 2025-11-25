import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
const TurnosAsignados = () => {
  const { t } = useLanguage();
  return <div style={{ padding: '20px' }}><h1>Turnos Asignados</h1><p>Asignación de turnos a empleados</p></div>;
};
export default TurnosAsignados;
