import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { initializeLanguage, setupLanguageSync } from './config';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize language from storage
    initializeLanguage().then(() => {
      setIsReady(true);
    });

    // Setup language sync with storage
    setupLanguageSync();
  }, []);

  if (!isReady) {
    return null; // or a loading spinner
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
};
