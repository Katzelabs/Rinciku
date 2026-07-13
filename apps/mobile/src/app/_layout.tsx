import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { AppState } from 'react-native';
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/components/auth-provider';
import { useAuth } from '@/features/auth/hooks/use-auth';
// Importing `i18n` also runs the init side-effect once. It must be provided via
// I18nextProvider (below) because this app and @rinciku/core resolve different
// physical copies of react-i18next (different react peer hash under pnpm), so
// the instance @rinciku/core registers globally is invisible to the app's
// useTranslation — context wins and bridges the gap.
import { useColorScheme } from '@/hooks/use-color-scheme';
import { i18n } from '@/lib/i18n';
import { AppThemeProvider, useThemePreference } from '@/lib/theme-preference';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

// Module-level so the cache survives re-renders (recreated only on reload).
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

// Brand the navigation chrome (background between screens, header tint) with the
// olive tokens instead of the stock react-navigation themes.
const navLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.card,
    primary: Colors.light.primary,
    text: Colors.light.foreground,
    border: Colors.light.border,
  },
};
const navDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.card,
    primary: Colors.dark.primary,
    text: Colors.dark.foreground,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  // Supabase pauses token auto-refresh in the background; drive it off AppState
  // so a foregrounded app keeps the session fresh. React Query has no window
  // focus on native, so the same listener feeds its focusManager.
  useEffect(() => {
    supabase.auth.startAutoRefresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
      focusManager.setFocused(state === 'active');
    });
    return () => {
      sub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Keyboard signal for edge-to-edge Android: SDK 56 forces edge-to-edge,
          which kills adjustResize AND React Native's own Keyboard events
          (verified: keyboardDidShow never fires, safe-area insets exclude the
          IME). react-native-keyboard-controller reads the IME window insets
          directly; screens use its KeyboardAvoidingView / KeyboardEvents. */}
      <KeyboardProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <AppThemeProvider>
              <SafeAreaProvider>
                <NavChrome>
                  <AuthProvider>
                    <RootNavigator fontsLoaded={fontsLoaded} />
                  </AuthProvider>
                </NavChrome>
              </SafeAreaProvider>
            </AppThemeProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

// Brands react-navigation's chrome with the olive nav themes, picking light vs
// dark from the resolved theme preference (not the OS directly). Lives below
// AppThemeProvider so it can read the context.
function NavChrome({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? navDark : navLight}>
      {/* Icon color for the edge-to-edge status bar (dark-on-light /
          light-on-dark). Without this Android leaves the default light icons,
          which vanish over the light header. `auto` resolves through
          useColorScheme, so it tracks the in-app theme override (which goes
          through Appearance.setColorScheme) as well as the OS. Screens can
          still override locally (the attachment viewer forces `light`). */}
      <StatusBar style='auto' />
      {children}
    </ThemeProvider>
  );
}

// Auth-driven navigation guards. Lives below AuthProvider so it can read the
// session/profile. The splash stays up until fonts AND the initial auth state
// resolve, so the first frame is already on the correct guarded branch.
function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, profile, loading } = useAuth();
  const { hydrated: themeHydrated } = useThemePreference();
  const ready = fontsLoaded && !loading && themeHydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = !!session;
  const onboarded = !!profile?.onboarded_at;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name='(auth)' />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name='(onboarding)' />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name='(app)' />
      </Stack.Protected>
      {/* Always reachable via deep link, regardless of auth state. */}
      <Stack.Screen
        name='reset-password'
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen name='auth/callback' />
      <Stack.Screen name='+not-found' />
    </Stack>
  );
}
