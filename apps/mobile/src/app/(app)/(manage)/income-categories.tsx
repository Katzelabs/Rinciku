import { useRef } from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenScroll } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  IncomeSourcesManager,
  type IncomeSourcesManagerHandle,
} from '@/features/incomes/components/income-sources-manager';

// Income-category management, mirroring the (expense) Categories screen: a
// prominent header "+" drives the manager's imperative create handle. Lives in
// the Manage section alongside the other planning surfaces.
export default function IncomeCategoriesScreen() {
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const managerRef = useRef<IncomeSourcesManagerHandle>(null);

  return (
    <ScreenScroll gap={Spacing.four}>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              label: t('categories.addCategory'),
              type: 'button',
              icon: { type: 'sfSymbol', name: 'plus' },
              tintColor: c.primary,
              variant: 'prominent',
              sharesBackground: false,
              onPress: () => managerRef.current?.openCreate(),
            },
          ],
        }}
      />
      <IncomeSourcesManager ref={managerRef} />
    </ScreenScroll>
  );
}
