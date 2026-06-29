import { useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassFab } from '@/components/glass-fab';

// The authenticated shell. NativeTabs renders a native tab bar — Liquid Glass on
// iOS 26+, Material 3 on Android — so we don't tint the bar ourselves. Each
// trigger's `name` matches a child route group that nests its own Stack for
// headers. The "More" tab is a real route group with a native list; `role` only
// styles the system item.
export default function AppLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');

  return (
    <View style={styles.flex}>
      <NativeTabs minimizeBehavior='onScrollDown'>
        <NativeTabs.Trigger name='(dashboard)'>
          <NativeTabs.Trigger.Icon sf='square.grid.2x2.fill' md='dashboard' />
          <NativeTabs.Trigger.Label>
            {t('nav.items.dashboard')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name='(expenses)'>
          <NativeTabs.Trigger.Icon sf='creditcard.fill' md='payments' />
          <NativeTabs.Trigger.Label>
            {t('nav.items.expenses')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name='(ai)'>
          <NativeTabs.Trigger.Icon sf='sparkles' md='auto_awesome' />
          <NativeTabs.Trigger.Label>
            {t('nav.items.aiChat')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name='(more)' role='more'>
          <NativeTabs.Trigger.Icon sf='ellipsis' md='more_horiz' />
          <NativeTabs.Trigger.Label>
            {t('nav.items.more')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>

      <View
        pointerEvents='box-none'
        style={[styles.fabWrap, { bottom: insets.bottom + 72 }]}
      >
        <GlassFab
          accessibilityLabel={t('nav.items.expenses')}
          onPress={() => router.push('/(app)/(expenses)/new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fabWrap: {
    position: 'absolute',
    right: 20,
  },
});
