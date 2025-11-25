import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ScanQR = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Escanear QR</h1>
      <p>Escaneo de códigos QR</p>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Esta página está optimizada para dispositivos móviles
      </p>
    </div>
  );
};

export default ScanQR;






