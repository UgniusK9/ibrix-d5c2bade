import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { lt } from './locales/lt';
import { en } from './locales/en';

// Get saved language or default to 'lt'
const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('language') || 'lt'
  : 'lt';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      lt: { translation: lt },
      en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'lt',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
