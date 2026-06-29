import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AiLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack screenOptions={{ headerLargeTitle: true }}>
      <Stack.Screen name='index' options={{ title: t('nav.items.aiChat') }} />
    </Stack>
  );
}
