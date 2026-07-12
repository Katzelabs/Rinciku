import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

// The tab bar's display order comes from the <NativeTabs.Trigger> order below,
// but the *initially focused* tab on cold start is the first route group by
// filesystem sort, not the trigger order (and `initialRouteName` only sets the
// back-behavior anchor, not the launch tab). The AI group is therefore named
// `(z-ai)` so it sorts LAST — matching its position in the tab bar and leaving
// `(dashboard)` as the first group, i.e. the screen the app opens on.
export const unstable_settings = {
  initialRouteName: '(dashboard)',
};

// Tab-bar icons. Both platforms use the same Material Design Icons for a
// consistent custom look: the glyphs are rasterized from the icon font via
// `getImageSourceSync` and passed to `src` (we intentionally omit `sf`, which
// would take priority on iOS and show SF Symbols instead). Image sources are
// computed once at module scope — `getImageSourceSync` is synchronous and must
// not run per render. The baked color is a placeholder; the native tab bar
// renders `src` as a template and re-tints per selection state (selected →
// `tintColor`). Requires a development build so the vector-icons native module +
// font are bundled (iOS needs the font in Info.plist `UIAppFonts`).
const ICON_SIZE = 24;
type MdiName = Parameters<typeof MaterialDesignIcons.getImageSourceSync>[0];
const src = (name: MdiName) =>
  MaterialDesignIcons.getImageSourceSync(name, ICON_SIZE, 'black');

const icons = {
  home: {
    default: src('home-variant-outline'),
    selected: src('home-variant-outline'),
  },
  expenses: {
    default: src('credit-card-outline'),
    selected: src('credit-card-outline'),
  },
  incomes: {
    default: src('wallet-bifold-outline'),
    selected: src('wallet-bifold-outline'),
  },
  manage: {
    default: src('view-dashboard-outline'),
    selected: src('view-dashboard-outline'),
  },
  ai: {
    default: src('robot-excited-outline'),
    selected: src('robot-excited-outline'),
  },
};

// The authenticated shell. NativeTabs renders a native tab bar — Liquid Glass on
// iOS 26+, Material 3 on Android. We tint the *selected* item with the brand
// primary (lime/green) via `tintColor`; the rest of the bar chrome stays system.
// Each trigger's `name` matches a child route group that nests its own Stack for
// headers. Tabs: Home · Expenses · Incomes · Manage · AI. Settings + FX live off
// the tab bar (reached from the dashboard profile avatar), so there is no
// "More" tab.
export default function AppLayout() {
  const { t } = useTranslation('common');
  const c = useTheme();
  // The AI chat is a full-screen, immersive experience: hide the whole native
  // tab bar while its tab is focused (users leave via the header "home" button).
  // `useSegments()` keeps the route-group names (e.g. `(z-ai)`) that
  // `usePathname` strips; the cast loosens the typed-routes union, which doesn't
  // model groups.
  //
  // iOS-ONLY: on Android, react-native-screens sets the hidden bar to GONE but
  // leaves its frame in the Fabric shadow tree, so the bar's ~80dp strip keeps
  // swallowing every React touch — the AI composer's send/attach buttons sit
  // exactly there and go dead (TextInput still works because native EditText
  // dispatch skips GONE views). Until that's fixed upstream, Android keeps the
  // Material bar visible on the AI tab and the composer pads above it.
  const segments = useSegments() as string[];
  const aiFocused = segments.includes('(z-ai)') && Platform.OS === 'ios';

  // Android's Material 3 bar needs explicit theming: `auto` label visibility
  // hides unselected labels at 4+ destinations (we have 5), and the selected
  // item uses foreground ink over a translucent lime indicator — lime stays an
  // accent wash, never a fill. `backgroundColor`/`iconColor`/`labelStyle` are
  // cross-platform props, so the whole object is gated to keep the iOS Liquid
  // Glass bar untouched (`tintColor` alone drives iOS).
  const androidTabBar =
    Platform.OS === 'android'
      ? ({
          labelVisibilityMode: 'labeled',
          backgroundColor: c.card,
          indicatorColor: withAlpha(c.primary, '33'),
          rippleColor: withAlpha(c.primary, '1F'),
          iconColor: { default: c.mutedForeground, selected: c.foreground },
          labelStyle: {
            default: {
              fontFamily: Fonts.medium,
              fontSize: 12,
              color: c.mutedForeground,
            },
            selected: {
              fontFamily: Fonts.semibold,
              fontSize: 12,
              color: c.foreground,
            },
          },
        } as const)
      : null;

  return (
    <NativeTabs
      hidden={aiFocused}
      minimizeBehavior='onScrollDown'
      tintColor={c.primary}
      {...androidTabBar}
    >
      <NativeTabs.Trigger name='(dashboard)'>
        <NativeTabs.Trigger.Icon src={icons.home} renderingMode='template' />
        <NativeTabs.Trigger.Label>
          {t('nav.items.home')}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='(expenses)'>
        <NativeTabs.Trigger.Icon
          src={icons.expenses}
          renderingMode='template'
        />
        <NativeTabs.Trigger.Label>
          {t('nav.items.expenses')}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='(incomes)'>
        <NativeTabs.Trigger.Icon src={icons.incomes} renderingMode='template' />
        <NativeTabs.Trigger.Label>
          {t('nav.items.incomes')}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='(manage)'>
        <NativeTabs.Trigger.Icon src={icons.manage} renderingMode='template' />
        <NativeTabs.Trigger.Label>
          {t('nav.items.manage')}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='(z-ai)'>
        <NativeTabs.Trigger.Icon src={icons.ai} renderingMode='template' />
        <NativeTabs.Trigger.Label>
          {t('nav.items.aiChat')}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
