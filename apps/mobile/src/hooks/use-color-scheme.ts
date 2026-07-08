import { useThemePreference } from '@/lib/theme-preference';

// The app's effective light/dark scheme. Reads the user's persisted theme
// preference (light/dark/system) instead of the OS setting directly, so a
// chosen theme survives restarts. `system` resolves to the device scheme inside
// the provider. Every `useTheme()` color lookup funnels through here, so this
// hook is the one place that decides the active scheme.
export function useColorScheme() {
  return useThemePreference().colorScheme;
}
