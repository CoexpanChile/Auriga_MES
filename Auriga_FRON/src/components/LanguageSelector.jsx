import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = () => {
  const { language, changeLanguage, getAvailableLanguages } = useLanguage();
  const languages = getAvailableLanguages();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
    }}>
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '5px',
          border: '1px solid #ddd',
          background: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;






