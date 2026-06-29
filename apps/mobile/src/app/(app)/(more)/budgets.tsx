import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function BudgetsScreen() {
  const { t } = useTranslation('common');
  return <PlaceholderScreen title={t('nav.items.budgets')} />;
}
