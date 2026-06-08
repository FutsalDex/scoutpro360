
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

type Language = 'es'; // Forzado a español por instrucción del usuario

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('es');

  useEffect(() => {
    // Forzamos español siempre
    setLanguage('es');
    localStorage.setItem('app-language', 'es');
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage('es'); // Ignoramos cambios a otros idiomas
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t: translations['es'],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
