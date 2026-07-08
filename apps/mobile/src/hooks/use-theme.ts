/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Chart, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  return Colors[useColorScheme()];
}

// Scheme-aware chart series palette (spend / income / grid) for the dashboard
// analytics charts. Mirrors `useTheme()` for the same light/dark resolution.
export function useChartColors() {
  return Chart[useColorScheme()];
}
