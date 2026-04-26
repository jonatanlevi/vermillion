import React, { createContext, useContext, useState } from 'react';
import { translations, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('he');

  const t = translations[lang];
  const isRTL = LANGUAGES.find(l => l.code === lang)?.rtl ?? true;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}
