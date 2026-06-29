import { CURRENCY_NAMES } from '@rinciku/core';
import * as Device from 'expo-device';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

// Proves the monorepo wiring: `@rinciku/core` resolves through Metro and its
// raw TypeScript transpiles, and an `EXPO_PUBLIC_*` var is readable client-side.
const workspaceCurrency = CURRENCY_NAMES.IDR;
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '(unset)';

function getDevMenuHint() {
  if (Device.isDevice) {
    return (
      <ThemedText type='small'>
        shake device or press <ThemedText type='code'>m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type='small'>
      press <ThemedText type='code'>{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type='title' style={styles.title}>
            Welcome to&nbsp;Expo
          </ThemedText>
        </ThemedView>

        <ThemedText type='code' style={styles.code}>
          get started
        </ThemedText>

        <ThemedView type='backgroundElement' style={styles.stepContainer}>
          <HintRow
            title='Try editing'
            hint={<ThemedText type='code'>src/app/index.tsx</ThemedText>}
          />
          <HintRow title='Dev tools' hint={getDevMenuHint()} />
          <HintRow
            title='Workspace'
            hint={
              <ThemedText type='small'>
                @rinciku/core →{' '}
                <ThemedText type='code'>{workspaceCurrency}</ThemedText>
              </ThemedText>
            }
          />
          <HintRow
            title='Env'
            hint={
              <ThemedText type='small'>
                EXPO_PUBLIC_SUPABASE_URL ={' '}
                <ThemedText type='code'>{supabaseUrl}</ThemedText>
              </ThemedText>
            }
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
