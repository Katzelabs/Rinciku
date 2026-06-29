import i18n, { type InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';

export const SUPPORTED_LANGUAGES = ['en', 'id'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = 'rinciku-lang';

/** Any i18next plugin/module accepted by `i18n.use()` (detectors, backends, …). */
type I18nPlugin = Parameters<typeof i18n.use>[0];

export interface InitI18nOptions {
  /**
   * Platform-specific plugins to register (e.g. `[LanguageDetector]` on web, an
   * expo-localization + AsyncStorage detector on native). `initReactI18next` is
   * always registered — callers only add what's platform-specific.
   */
  plugins?: I18nPlugin[];
  /** Detector configuration, passed straight through to i18next. */
  detection?: InitOptions['detection'];
  /** Force an initial language (e.g. mobile resolving it before init). */
  lng?: string;
}

/**
 * Platform-agnostic i18next initialization. Shared between the web app and the
 * Expo app: resources, namespaces and fallback live here; the browser-only
 * language detector + `<html lang>` sync stay in `./index.ts` (the `./i18n`
 * web entry) so native consumers can import this without pulling
 * `i18next-browser-languagedetector`. Returns the shared singleton.
 */
export function initI18n(opts: InitI18nOptions = {}) {
  let instance = i18n.use(initReactI18next);
  for (const plugin of opts.plugins ?? []) {
    instance = instance.use(plugin);
  }
  void instance.init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    ...(opts.lng ? { lng: opts.lng } : {}),
    ...(opts.detection ? { detection: opts.detection } : {}),
  });
  return i18n;
}

export default i18n;

export function isLanguage(value: unknown): value is Language {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}
