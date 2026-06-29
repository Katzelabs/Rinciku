import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { AppState, useColorScheme } from 'react-native';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/components/auth-provider';
import { useAuth } from '@/features/auth/hooks/use-auth';
// Importing `i18n` also runs the init side-effect once. It must be provided via
// I18nextProvider (below) because this app and @rinciku/core resolve different
// physical copies of react-i18next (different react peer hash under pnpm), so
// the instance @rinciku/core registers globally is invisible to the app's
// useTranslation — context wins and bridges the gap.
import { i18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

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
  const scheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  // Supabase pauses token auto-refresh in the background; drive it off AppState
  // so a foregrounded app keeps the session fresh.
  useEffect(() => {
    supabase.auth.startAutoRefresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => {
      sub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <ThemeProvider value={scheme === 'dark' ? navDark : navLight}>
            <AuthProvider>
              <RootNavigator fontsLoaded={fontsLoaded} />
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

// Auth-driven navigation guards. Lives below AuthProvider so it can read the
// session/profile. The splash stays up until fonts AND the initial auth state
// resolve, so the first frame is already on the correct guarded branch.
function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, profile, loading } = useAuth();
  const ready = fontsLoaded && !loading;

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
