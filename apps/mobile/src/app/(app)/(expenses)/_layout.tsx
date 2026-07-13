import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';
import { resetStackOnTabBlur } from '@/lib/navigation';

export default function ExpensesLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack
      screenListeners={resetStackOnTabBlur}
      screenOptions={useStackScreenOptions()}
    >
      <Stack.Screen
        name='index'
        options={{ headerTitle: t('expenses:page.title') }}
      />
      <Stack.Screen name='list' options={{ title: t('expenses:list.title') }} />
      <Stack.Screen
        name='new'
        options={{
          presentation: 'modal',
          headerLargeTitle: false,
          title: t('expenses:page.addExpense'),
          // Android has no native sheet; slide up instead of the stack's push.
          ...(Platform.OS === 'android' && { animation: 'slide_from_bottom' }),
        }}
      />
      <Stack.Screen
        name='[id]'
        options={{ headerLargeTitle: false, title: t('expenses:detail.title') }}
      />
    </Stack>
  );
}
