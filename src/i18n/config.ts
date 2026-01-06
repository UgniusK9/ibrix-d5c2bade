import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { lt } from './locales/lt';
import { en } from './locales/en';

// Get saved language or default to 'lt'
const getSavedLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'lt';
  }
  return 'lt';
};

// Initialize i18n only once
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        lt: { translation: lt },
        en: { translation: en },
      },
      lng: getSavedLanguage(),
      fallbackLng: 'lt',
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
