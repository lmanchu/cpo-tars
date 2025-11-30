import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Storage } from '@plasmohq/storage';

import enTranslations from '../locales/en.json';
import zhTWTranslations from '../locales/zh-TW.json';

const storage = new Storage();

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      'zh-TW': {
        translation: zhTWTranslations
      }
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

// Load language from storage and update i18n
export const initializeLanguage = async () => {
  try {
    const userSettings = await storage.get<any>('userSettings');
    const savedLanguage = userSettings?.uiLanguage || userSettings?.targetLanguage || 'en';

    if (savedLanguage && i18n.language !== savedLanguage) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('[i18n] Failed to load language from storage:', error);
  }
};

// Listen for language changes and update i18n
export const setupLanguageSync = () => {
  storage.watch({
    'userSettings': (change) => {
      const newSettings = change.newValue as any;
      const uiLanguage = newSettings?.uiLanguage || newSettings?.targetLanguage;

      if (uiLanguage && i18n.language !== uiLanguage) {
        i18n.changeLanguage(uiLanguage);
      }
    }
  });
};

export default i18n;
