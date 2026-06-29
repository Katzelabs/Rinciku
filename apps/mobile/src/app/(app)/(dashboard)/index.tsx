import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function DashboardScreen() {
  const { t } = useTranslation('common');
  return (
    <PlaceholderScreen
      title={t('nav.items.dashboard')}
      subtitle='Your income, spending, and AI budget snapshot will live here.'
    />
  );
}
