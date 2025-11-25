import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
const SalidasEspeciales = () => {
  const { t } = useLanguage();
  return <div style={{ padding: '20px' }}><h1>Salidas Especiales</h1><p>Gestión de salidas especiales</p></div>;
};
export default SalidasEspeciales;
