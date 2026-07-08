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

import { Platform, StyleSheet, type TextStyle } from 'react-native';

export const Colors = {
  light: {
    // Warm, olive-biased paper (was #FAFAF7 — nearly identical to the white
    // card, so cards dissolved). Nudged warmer/darker so white `card` surfaces
    // read as raised objects against it.
    background: '#F2F2EA',
    foreground: '#0C0C09',
    card: '#FFFFFF',
    cardForeground: '#0C0C09',
    popover: '#FFFFFF',
    popoverForeground: '#0C0C09',
    primary: '#9AE600',
    primaryForeground: '#35530E',
    // Legible positive-money green — for income amounts / a healthy net. Distinct
    // from `primary` (the neon lime accent), which was previously overused as a
    // giant text fill and read as "startup demo" rather than "trusted with money".
    positive: '#3F7A00',
    // "Money out" accent for the expense summary/amount heroes — a calm muted
    // rose. Reads as spending without the alarm of `destructive`, and stays
    // clear of both the `positive` green and the lime `primary` CTA. Used only
    // as a soft wash/border/chip tint; the expense hero number itself stays ink.
    expense: '#9F4D6E',
    secondary: '#F4F4F5',
    secondaryForeground: '#18181B',
    muted: '#F4F4F0',
    mutedForeground: '#7C7C67',
    accent: '#F4F4F0',
    accentForeground: '#1D1D16',
    destructive: '#E7000B',
    destructiveForeground: '#FFFFFF',
    // Amber "warning" status (ported from the web meter's amber-500/700). Used
    // by budget meters / health badges for the "approaching / watch" state.
    // Soft surfaces are derived at call time via `withAlpha(warning, '22')`.
    warning: '#F59E0B',
    warningForeground: '#B45309',
    border: '#E8E8E3',
    input: '#E8E8E3',
    ring: '#ABAB9C',
    // @deprecated Legacy aliases — prefer foreground / mutedForeground / muted /
    // border. Kept only until the last demo components are migrated.
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
    // Brighter on the dark card so positive amounts stay legible.
    positive: '#A3E635',
    // Lighter rose on the dark card so the expense accent stays legible.
    expense: '#DC9BB4',
    secondary: '#27272A',
    secondaryForeground: '#FAFAFA',
    muted: '#2B2B22',
    mutedForeground: '#ABAB9C',
    accent: '#2B2B22',
    accentForeground: '#FBFBF9',
    destructive: '#FF6467',
    destructiveForeground: '#0A0A08',
    // Amber-400 reads better than amber-500 on the dark surfaces.
    warning: '#FBBF24',
    warningForeground: '#FBBF24',
    border: 'rgba(255,255,255,0.10)',
    input: 'rgba(255,255,255,0.15)',
    ring: '#7C7C67',
    // @deprecated Legacy aliases — see the light scheme note above.
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
  // @deprecated Legacy aliases — prefer regular/medium/semibold/bold.
  sans: 'Figtree_400Regular',
  serif: Platform.select({ ios: 'ui-serif', default: 'serif' }),
  rounded: Platform.select({ ios: 'ui-rounded', default: 'normal' }),
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
};

/**
 * Type scale. Every text style in the app should come from here instead of
 * hand-pairing `fontFamily: Fonts.*` with a literal `fontSize` — that pairing
 * was previously copy-pasted across ~49 StyleSheets with drifting sizes.
 * Consume via the `<AppText variant>` primitive, or spread directly
 * (`...Type.overline`) inside a StyleSheet when composing.
 *
 * Names map to the sizes already in use (12–32). Color is NOT baked in — set it
 * at the call site from a theme token so light/dark both work.
 */
export const Type = {
  /** Summary hero total / detail amount. */
  hero: { fontFamily: Fonts.bold, fontSize: 32 },
  /** Screen section heading (e.g. "Recent activity"). */
  title: { fontFamily: Fonts.bold, fontSize: 22 },
  /** Page-sheet title. */
  sheetTitle: { fontFamily: Fonts.bold, fontSize: 20 },
  /** Card / empty-state title. */
  heading: { fontFamily: Fonts.semibold, fontSize: 17 },
  /** Default body copy. */
  body: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 22 },
  /** Emphasized body / row title. */
  bodyMedium: { fontFamily: Fonts.medium, fontSize: 15 },
  /** Field labels, secondary actions. */
  label: { fontFamily: Fonts.medium, fontSize: 14 },
  /** Right-aligned money amounts in rows. */
  amount: { fontFamily: Fonts.semibold, fontSize: 15 },
  /** Small emphasized figures/labels — group subtotals, status badges. */
  amountSmall: { fontFamily: Fonts.semibold, fontSize: 13 },
  /** Subtitles, helper text. */
  caption: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
  /** Uppercase group/section labels. */
  overline: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
} as const;

export type TypeVariant = keyof typeof Type;

/**
 * Spread onto any money `Text` so digits use tabular (fixed-width) figures —
 * columns of amounts line up and a number doesn't jitter as it changes. Applied
 * automatically by `<AppText>` for the money variants (hero / amount /
 * amountSmall); spread manually onto raw `Text` money styles.
 */
export const TabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

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
 * Border widths. `hairline` is the standard card/input stroke — a crisp 2×
 * device hairline. Named here so the `StyleSheet.hairlineWidth * 2` idiom
 * (previously repeated in ~25 files) has one source.
 */
export const Border = {
  hairline: StyleSheet.hairlineWidth * 2,
} as const;

/**
 * Default card geometry, shared by the `<Card>` primitive and any surface that
 * needs to match it. One radius (`2xl`) + one padding (`four`) kills the
 * Settings-vs-everything-else corner/padding drift.
 */
export const CardStyle = {
  radius: Radius['2xl'],
  padding: Spacing.four,
  borderWidth: Border.hairline,
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

/**
 * Chart series colors for the dashboard analytics charts. The mobile theme has
 * no `--chart-*` tokens (unlike the web), so the two fixed series — spend and
 * income — live here, per scheme. Spend leans on the olive/lime brand hue;
 * income is a cool sky so the two read apart in both light and dark. Categorical
 * charts (the category/tier donut) use each item's own `.color`, not this
 * palette. Select via `useChartColors()`.
 */
export const Chart = {
  light: {
    spent: '#65A30D', // lime-600 — readable on the light card
    income: '#0EA5E9', // sky-500
    grid: 'rgba(12,12,9,0.08)',
  },
  dark: {
    spent: '#A3E635', // lime-400 — brighter for the dark card
    income: '#38BDF8', // sky-400
    grid: 'rgba(255,255,255,0.12)',
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
