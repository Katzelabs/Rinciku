import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ManageLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name='index' options={{ title: t('nav.items.manage') }} />
    </Stack>
  );
}
