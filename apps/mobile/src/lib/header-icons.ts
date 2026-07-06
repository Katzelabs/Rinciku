import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

// Native header items (expo-router `unstable_header*Items`) render an
// ImageSource, not a React node — and SF Symbols are iOS-only, so a
// `type: 'sfSymbol'` icon renders blank on Android. Rasterizing Material Design
// Icons via `getImageSourceSync` gives one header-icon vocabulary that tints and
// sizes identically on iOS + Android (the same approach the NativeTabs bar
// uses). The calls are synchronous and must run once at module scope, never per
// header render — so the icons are baked here into a shared, pre-computed map
// instead of being re-rasterized inline per screen.
const HEADER_ICON_SIZE = 26;

type MdiName = Parameters<typeof MaterialDesignIcons.getImageSourceSync>[0];

// Baked black; `tinted: true` lets the native header apply its own tint (the
// brand primary, or a prominent button's foreground) so a single asset works in
// every slot and both color schemes.
function bake(name: MdiName) {
  return {
    type: 'image' as const,
    source: MaterialDesignIcons.getImageSourceSync(
      name,
      HEADER_ICON_SIZE,
      'black'
    ),
    tinted: true,
  };
}

/**
 * Pre-baked header-button icons, shared across screens so icon size, color, and
 * the item shape live in one place. Add new header icons here rather than
 * re-rasterizing MDI inline per screen. Spread into a native header item's
 * `icon` field: `icon: headerIcon.add`.
 */
export const headerIcon = {
  add: bake('plus'),
  camera: bake('camera-outline'),
  home: bake('home-variant-outline'),
  history: bake('menu'),
} as const;
