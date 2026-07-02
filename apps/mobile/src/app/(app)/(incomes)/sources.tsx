import { useRef } from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';

import { ScreenScroll } from '@/components/ui';
import { HeaderAction } from '@/components/header-action';
import { Spacing } from '@/constants/theme';
import {
  IncomeSourcesManager,
  type IncomeSourcesManagerHandle,
} from '@/features/incomes/components/income-sources-manager';

// Standalone income-sources management screen, reached from the Incomes header.
// The header "+" drives the manager's imperative create handle.
export default function IncomeSourcesScreen() {
  const { t } = useTranslation('incomes');
  const managerRef = useRef<IncomeSourcesManagerHandle>(null);

  return (
    <ScreenScroll gap={Spacing.four}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderAction
              systemImage='plus'
              icon={Plus}
              accessibilityLabel={t('categories.addCategory')}
              onPress={() => managerRef.current?.openCreate()}
            />
          ),
        }}
      />
      <IncomeSourcesManager ref={managerRef} />
    </ScreenScroll>
  );
}
