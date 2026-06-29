import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import type { LanguageDetectorAsyncModule } from 'i18next';

import {
  initI18n,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
} from '@rinciku/core/i18n/init';

// Mobile language detector: read the persisted choice from AsyncStorage, else
// fall back to the device locale (expo-localization), else English. The web
// entry (`@rinciku/core/i18n`) uses a browser detector + localStorage, which we
// deliberately avoid here — only `.../i18n/init` is imported so no
// browser-only deps reach Metro. Persisting back through `cacheUserLanguage`
// keeps i18next and storage in sync when the language changes.
const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  detect: async () => {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
    const device = getLocales()[0]?.languageCode;
    return isLanguage(device) ? device : 'en';
  },
  cacheUserLanguage: async (lng: string) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  },
};

export const i18n = initI18n({ plugins: [languageDetector] });
