import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

// Placeholder Incomes tab. The incomes feature isn't extracted to
// @rinciku/domain / mobile yet (only the web app + DB tables exist), so this
// tab renders a branded "coming soon" state until the real feature lands.
export default function IncomesScreen() {
  const { t } = useTranslation('common');
  return (
    <PlaceholderScreen
      title={t('nav.items.incomes')}
      subtitle={t('incomes:placeholder.subtitle')}
    />
  );
}
