import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';
import { resetStackOnTabBlur } from '@/lib/navigation';

export default function IncomesLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack
      screenListeners={resetStackOnTabBlur}
      screenOptions={useStackScreenOptions()}
    >
      <Stack.Screen name='index' options={{ title: t('nav.items.incomes') }} />
      <Stack.Screen name='list' options={{ title: t('incomes:list.title') }} />
      <Stack.Screen
        name='new'
        options={{
          presentation: 'modal',
          headerLargeTitle: false,
          title: t('nav.items.incomes'),
        }}
      />
      <Stack.Screen
        name='[id]'
        options={{ headerLargeTitle: false, title: t('incomes:detail.title') }}
      />
    </Stack>
  );
}
