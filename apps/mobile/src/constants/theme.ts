/**
 * Rinciku mobile design tokens.
 *
 * The olive brand palette is ported from the web app's CSS-first Tailwind v4
 * config (`apps/web/src/index.css`, OKLch) and converted to sRGB hex for React
 * Native. Semantic token names mirror the web (`background`, `foreground`,
 * `primary`, `muted`, …) so screens read the same vocabulary on both platforms.
 *
 * Glass chrome (NativeTabs, GlassView) renders its own system material; these
 * tokens drive solid content surfaces and the glass tint.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FAFAF7',
    foreground: '#0C0C09',
    card: '#FFFFFF',
    cardForeground: '#0C0C09',
    popover: '#FFFFFF',
    popoverForeground: '#0C0C09',
    primary: '#9AE600',
    primaryForeground: '#35530E',
    secondary: '#F4F4F5',
    secondaryForeground: '#18181B',
    muted: '#F4F4F0',
    mutedForeground: '#7C7C67',
    accent: '#F4F4F0',
    accentForeground: '#1D1D16',
    destructive: '#E7000B',
    destructiveForeground: '#FFFFFF',
    border: '#E8E8E3',
    input: '#E8E8E3',
    ring: '#ABAB9C',
    // Legacy aliases kept so existing demo components keep compiling.
    text: '#0C0C09',
    textSecondary: '#7C7C67',
    backgroundElement: '#F4F4F0',
    backgroundSelected: '#E8E8E3',
  },
  dark: {
    background: '#0A0A08',
    foreground: '#FBFBF9',
    card: '#1D1D16',
    cardForeground: '#FBFBF9',
    popover: '#1D1D16',
    popoverForeground: '#FBFBF9',
    primary: '#7CCF00',
    primaryForeground: '#35530E',
    secondary: '#27272A',
    secondaryForeground: '#FAFAFA',
    muted: '#2B2B22',
    mutedForeground: '#ABAB9C',
    accent: '#2B2B22',
    accentForeground: '#FBFBF9',
    destructive: '#FF6467',
    destructiveForeground: '#0A0A08',
    border: 'rgba(255,255,255,0.10)',
    input: 'rgba(255,255,255,0.15)',
    ring: '#7C7C67',
    // Legacy aliases.
    text: '#FBFBF9',
    textSecondary: '#ABAB9C',
    backgroundElement: '#2B2B22',
    backgroundSelected: '#27272A',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Figtree (the web brand typeface) loaded via `@expo-google-fonts/figtree`.
 * The values are the family names the font module registers — load them with
 * `useFonts` in the root layout before referencing these.
 */
export const Fonts = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  // Legacy aliases.
  sans: 'Figtree_400Regular',
  serif: Platform.select({ ios: 'ui-serif', default: 'serif' }),
  rounded: Platform.select({ ios: 'ui-rounded', default: 'normal' }),
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
};

/** Spacing scale (px). */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Corner radii, derived from the web `--radius: 0.625rem` (~10px) base. */
export const Radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  '2xl': 18,
  /** Fully rounded — for pills / circular chrome. */
  pill: 999,
} as const;

/**
 * Soft elevation presets as CSS `boxShadow` strings (the RN `boxShadow` style
 * prop is supported on the New Architecture).
 * Keep shadows subtle; they read on light surfaces and stay invisible in dark.
 */
export const Shadow = {
  /** Resting elevation for primary buttons / cards. */
  sm: '0 1px 2px rgba(12,12,9,0.06), 0 2px 6px rgba(12,12,9,0.06)',
  /** Focused input / pressed-card emphasis. */
  md: '0 2px 8px rgba(12,12,9,0.10)',
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
