import { useRef } from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenScroll } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { headerIcon } from '@/lib/header-icons';
import { headerItems } from '@/lib/header-items';
import { useTheme } from '@/hooks/use-theme';
import {
  EssentialsManager,
  type EssentialsManagerHandle,
} from '@/features/essentials/components/essentials-manager';

export default function EssentialsScreen() {
  const c = useTheme();
  const { t } = useTranslation('essentials');
  const managerRef = useRef<EssentialsManagerHandle>(null);

  return (
    <ScreenScroll gap={Spacing.four}>
      <Stack.Screen
        options={{
          ...headerItems('right', () => [
            {
              label: t('common:actions.add'),
              type: 'button',
              icon: headerIcon.add,
              tintColor: c.primary,
              variant: 'prominent',
              sharesBackground: false,
              onPress: () => managerRef.current?.openCreate(),
            },
          ]),
        }}
      />
      <EssentialsManager ref={managerRef} inlineAdd={false} />
    </ScreenScroll>
  );
}
