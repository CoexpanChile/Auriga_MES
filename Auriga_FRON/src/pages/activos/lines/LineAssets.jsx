import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

const LineAssets = () => {
  const { lineId } = useParams();
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Activos de Línea</h1>
      <p>Línea ID: {lineId}</p>
      <p>Activos de una línea específica</p>
    </div>
  );
};

export default LineAssets;






