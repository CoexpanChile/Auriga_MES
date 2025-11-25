import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
const Turnos = () => {
  const { t } = useLanguage();
  return <div style={{ padding: '20px' }}><h1>Turnos</h1><p>Gestión de turnos de trabajo</p></div>;
};
export default Turnos;
