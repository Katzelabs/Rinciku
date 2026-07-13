import type { NativeStackNavigationOptions } from 'expo-router';
import { Platform } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Shared `screenOptions` for the tab route-group Stacks. iOS keeps the stock
 * large-title + glass header (no `headerStyle`, so the system material stays).
 * Android's default header is a white Material bar that clashes with the olive
 * ground, so it gets a flat header in the screen background color with Figtree
 * titles — the header blends into the content instead of banding across it.
 * Android's default push transition is the system zoom (Android 12+), so it
 * gets the iOS-style right-to-left push instead (`ios_from_right` is a no-op
 * on iOS — it resolves to the platform default).
 */
export function useStackScreenOptions(): NativeStackNavigationOptions {
  const c = useTheme();
  return {
    headerLargeTitle: true,
    headerBackButtonDisplayMode: 'minimal',
    ...(Platform.OS === 'android' && {
      animation: 'ios_from_right',
      headerStyle: { backgroundColor: c.background },
      headerTintColor: c.foreground,
      headerTitleStyle: { fontFamily: Fonts.semibold, color: c.foreground },
      headerShadowVisible: false,
    }),
  };
}
