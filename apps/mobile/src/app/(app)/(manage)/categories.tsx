import { useRef } from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenScroll } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  CategoriesManager,
  type CategoriesManagerHandle,
} from '@/features/categories/components/categories-manager';

export default function CategoriesScreen() {
  const c = useTheme();
  const { t } = useTranslation('categories');
  const managerRef = useRef<CategoriesManagerHandle>(null);

  return (
    <ScreenScroll gap={Spacing.four}>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              label: t('spending.addTier'),
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
      <CategoriesManager ref={managerRef} inlineAdd={false} />
    </ScreenScroll>
  );
}
