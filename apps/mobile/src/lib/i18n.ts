import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import {
  initI18n,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from '@rinciku/core/i18n/init';

// Resolve the device language synchronously (expo-localization's getLocales is
// sync). Guarded because the native module can throw if called too early.
function deviceLanguage(): Language {
  try {
    const code = getLocales()[0]?.languageCode;
    return isLanguage(code) ? code : 'en';
  } catch {
    return 'en';
  }
}

// Initialize i18next SYNCHRONOUSLY with an explicit language, so translations
// are ready on the very first render. An async language detector would resolve
// after the first frame (or stall init entirely if it rejected), leaving the UI
// showing raw keys like "signIn.title". This mirrors the web app, which also
// inits synchronously. The web entry (`@rinciku/core/i18n`) is deliberately not
// imported — it pulls a browser-only detector.
export const i18n = initI18n({ lng: deviceLanguage() });

// Persist every language change (toggle, settings) back to storage.
i18n.on('languageChanged', (lng: string) => {
  void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
});

// Restore the user's persisted choice, if any, after the synchronous init.
// `changeLanguage` fires 'languageChanged', which react-i18next re-renders on.
void AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored) => {
  if (isLanguage(stored) && stored !== i18n.resolvedLanguage) {
    void i18n.changeLanguage(stored);
  }
});
