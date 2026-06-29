import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function CategoriesScreen() {
  const { t } = useTranslation('common');
  return <PlaceholderScreen title={t('nav.items.categories')} />;
}
