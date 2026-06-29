import LanguageDetector from 'i18next-browser-languagedetector';
import i18n, { initI18n, LANGUAGE_STORAGE_KEY } from './init';

// Web entry for `@rinciku/core/i18n`. Re-exports the platform-agnostic core and
// wires the browser-only bits (localStorage/navigator detector + `<html lang>`
// sync). Native apps import `@rinciku/core/i18n/init` and supply their own
// detector instead, so this browser detector never reaches Metro.
export * from './init';
export { default } from './init';

initI18n({
  plugins: [LanguageDetector],
  detection: {
    order: ['localStorage', 'navigator'],
    lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    caches: ['localStorage'],
  },
});

// Keep <html lang> in sync for a11y and correct default formatting.
const applyHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
};
applyHtmlLang(i18n.resolvedLanguage ?? 'en');
i18n.on('languageChanged', applyHtmlLang);
