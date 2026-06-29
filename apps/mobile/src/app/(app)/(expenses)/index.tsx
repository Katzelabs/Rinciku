import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ExpensesScreen() {
  const { t } = useTranslation('common');
  return (
    <PlaceholderScreen
      title={t('nav.items.expenses')}
      subtitle='Your expense list, filters, and CSV import will live here.'
    />
  );
}
