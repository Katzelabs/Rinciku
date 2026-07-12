import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackScreenOptions } from '@/hooks/use-stack-screen-options';
import { resetStackOnTabBlur } from '@/lib/navigation';

export default function AiLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack
      screenListeners={resetStackOnTabBlur}
      screenOptions={useStackScreenOptions()}
    >
      <Stack.Screen name='index' options={{ title: t('nav.items.aiChat') }} />
    </Stack>
  );
}
