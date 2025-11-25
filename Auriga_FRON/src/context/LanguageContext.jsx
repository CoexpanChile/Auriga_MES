import React, { createContext, useContext, useState, useEffect } from 'react';
import { es } from '../locales/es/translations';
import { en } from '../locales/en/translations';
import { de } from '../locales/de/translations';
import { fr } from '../locales/fr/translations';
import { it } from '../locales/it/translations';
import { ru } from '../locales/ru/translations';

const translations = {
  es,
  en,
  de,
  fr,
  it,
  ru,
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Obtener idioma del localStorage o usar español por defecto
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('app_language');
    return savedLanguage && translations[savedLanguage] ? savedLanguage : 'es';
  });

  const [t, setT] = useState(() => translations[language]);

  useEffect(() => {
    // Actualizar traducciones cuando cambia el idioma
    setT(translations[language]);
    // Guardar en localStorage
    localStorage.setItem('app_language', language);
  }, [language]);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    } else {
      console.warn(`Language ${lang} not supported. Available: ${Object.keys(translations).join(', ')}`);
    }
  };

  const getAvailableLanguages = () => {
    return [
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    ];
  };

  const value = {
    language,
    t,
    changeLanguage,
    getAvailableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};






