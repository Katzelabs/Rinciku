import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function AiScreen() {
  const { t } = useTranslation('common');
  return (
    <PlaceholderScreen
      title={t('nav.items.aiChat')}
      subtitle='In-the-moment purchase consultation grounded in your real budget will live here.'
    />
  );
}
