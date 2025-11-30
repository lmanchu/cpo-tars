import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { initializeLanguage, setupLanguageSync } from './config';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize language from storage (async, non-blocking)
    initializeLanguage();

    // Setup language sync with storage
    setupLanguageSync();
  }, []);

  // Always render immediately with default language (English)
  // Language will update automatically when loaded from storage
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
};
