import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
const HorariosTrabajo = () => {
  const { t } = useLanguage();
  return <div style={{ padding: '20px' }}><h1>Horarios de Trabajo</h1><p>Horarios de trabajo diarios</p></div>;
};
export default HorariosTrabajo;
