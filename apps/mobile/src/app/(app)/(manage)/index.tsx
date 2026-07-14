import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Coins, Repeat, Tags, Target } from '@/lib/icons';

import { Card, ScreenScroll } from '@/components/ui';
import { SettingsRow } from '@/components/settings-row';
import { Spacing } from '@/constants/theme';

// The Manage tab is a settings list: each row links to a dedicated screen for
// one planning surface — Essentials, Budgets, Categories. The screens live in
// the sibling route files and own their own header actions.
export default function ManageScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <ScreenScroll gap={Spacing.four}>
      <Card padding={0}>
        <SettingsRow
          icon={Repeat}
          title={t('nav.items.essentials')}
          subtitle={t('manage.rows.essentials')}
          onPress={() => router.push('/(app)/(manage)/essentials')}
        />
        <SettingsRow
          icon={Target}
          title={t('nav.items.budgets')}
          subtitle={t('manage.rows.budgets')}
          onPress={() => router.push('/(app)/(manage)/budgets')}
          topBorder
        />
        <SettingsRow
          icon={Tags}
          title={t('nav.items.categories')}
          subtitle={t('manage.rows.categories')}
          onPress={() => router.push('/(app)/(manage)/categories')}
          topBorder
        />
        <SettingsRow
          icon={Coins}
          title={t('incomes:categories.title')}
          subtitle={t('manage.rows.incomeCategories')}
          onPress={() => router.push('/(app)/(manage)/income-categories')}
          topBorder
        />
      </Card>
    </ScreenScroll>
  );
}
