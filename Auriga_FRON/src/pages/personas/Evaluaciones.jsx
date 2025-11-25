import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
const Evaluaciones = () => {
  const { t } = useLanguage();
  return <div style={{ padding: '20px' }}><h1>Evaluaciones</h1><p>Evaluaciones de personal</p></div>;
};
export default Evaluaciones;
