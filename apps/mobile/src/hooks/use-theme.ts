/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Chart, CodeSyntax, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  return Colors[useColorScheme()];
}

// Scheme-aware syntax-highlight palette for fenced code blocks. Mirrors
// `useTheme()` for the same light/dark resolution.
export function useCodeSyntax() {
  return CodeSyntax[useColorScheme()];
}

// Scheme-aware chart series palette (spend / income / grid) for the dashboard
// analytics charts. Mirrors `useTheme()` for the same light/dark resolution.
export function useChartColors() {
  return Chart[useColorScheme()];
}
