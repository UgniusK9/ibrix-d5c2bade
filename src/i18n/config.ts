import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { safeLocalStorageGetItem } from '@/lib/browser-storage';

// Get saved language or default to 'lt'
const getSavedLanguage = () => {
  return safeLocalStorageGetItem('language') || 'lt';
};

const lang = getSavedLanguage();

// Initialize i18n with lazy-loaded locale bundles
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {},
      lng: lang,
      fallbackLng: 'lt',
      interpolation: {
        escapeValue: false,
      },
    });

  // Load the active locale asynchronously — does not block render
  const loadLocale = async (locale: string) => {
    try {
      const mod = await import(`./locales/${locale}.ts`);
      const key = locale === 'lt' ? 'lt' : 'en';
      i18n.addResourceBundle(key, 'translation', mod[key] || mod.default, true, true);
    } catch {
      console.warn(`Failed to load locale: ${locale}`);
    }
  };

  loadLocale(lang);

  const preloadLocale = (locale: string) => {
    const run = () => {
      void loadLocale(locale);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(run);
      return;
    }

    globalThis.setTimeout(run, 1);
  };

  preloadLocale(lang === 'lt' ? 'en' : 'lt');
}

export default i18n;
