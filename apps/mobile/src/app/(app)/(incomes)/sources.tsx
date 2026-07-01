import { useRef } from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { HeaderAddButton } from '@/components/header-add-button';
import { Spacing } from '@/constants/theme';
import {
  IncomeSourcesManager,
  type IncomeSourcesManagerHandle,
} from '@/features/incomes/components/income-sources-manager';
import { useTheme } from '@/hooks/use-theme';

// Standalone income-sources management screen, reached from the Incomes header.
// The header "+" drives the manager's imperative create handle.
export default function IncomeSourcesScreen() {
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const managerRef = useRef<IncomeSourcesManagerHandle>(null);

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderAddButton
              accessibilityLabel={t('categories.addCategory')}
              onPress={() => managerRef.current?.openCreate()}
            />
          ),
        }}
      />
      <IncomeSourcesManager ref={managerRef} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
});
