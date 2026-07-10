import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  Appearance,
  useColorScheme as useDeviceColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The user's theme choice. Mirrors the web app (next-themes): `system` follows
// the OS appearance, `light`/`dark` pin it. Persisted to AsyncStorage — the
// mobile analog of the web's localStorage — so the choice survives restarts
// instead of resetting to the device setting on every open.
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'rinciku-theme';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

interface ThemePreferenceContextValue {
  /** The stored choice as picked by the user (may be `system`). */
  preference: ThemePreference;
  /** Update + persist the choice. */
  setPreference: (next: ThemePreference) => void;
  /** The effective light/dark scheme after resolving `system`. */
  colorScheme: ResolvedScheme;
  /** False until the persisted value has been read from AsyncStorage. */
  hydrated: boolean;
}

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const device = useDeviceColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  // Restore the saved preference once, after mount. AsyncStorage is async, so
  // the first frame defaults to `system`; `hydrated` lets the root layout hold
  // the splash until this resolves, avoiding a light/dark flash.
  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (cancelled) return;
      if (isThemePreference(stored)) setPreferenceState(stored);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  // Push the choice down to the native window appearance. StyleSheet components
  // read our JS tokens via `useTheme()`, but native views — the @expo/ui SwiftUI
  // trees, GlassView, NativeTabs — follow the OS window's userInterfaceStyle.
  // `setColorScheme` sets `window.overrideUserInterfaceStyle` so those track the
  // in-app choice too; `null` releases the override so `system` live-follows the
  // OS (and keeps `useDeviceColorScheme` reporting the real device value).
  // `'unspecified'` clears the window override so `system` live-follows the OS.
  useEffect(() => {
    Appearance.setColorScheme(
      preference === 'system' ? 'unspecified' : preference
    );
  }, [preference]);

  // `device` is `ColorSchemeName` ('light' | 'dark' | 'unspecified' | null);
  // anything that isn't an explicit dark resolves to light.
  const colorScheme: ResolvedScheme =
    preference === 'system'
      ? device === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  return (
    <ThemePreferenceContext.Provider
      value={{ preference, setPreference, colorScheme, hydrated }}
    >
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error(
      'useThemePreference must be used within <AppThemeProvider>'
    );
  }
  return ctx;
}
