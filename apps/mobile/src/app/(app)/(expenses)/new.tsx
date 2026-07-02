import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useTheme } from '@/hooks/use-theme';

// New-expense modal, launched from the Expenses header "+". On success the list
// refetches on focus (see the expenses index screen).
export default function NewExpenseScreen() {
  const c = useTheme();
  const router = useRouter();
  const { t } = useTranslation('expenses');
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <AppText variant='caption' color='mutedForeground' style={styles.intro}>
        {t('page.createDescription')}
      </AppText>
      <ExpenseForm mode='create' onSuccess={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
  intro: { marginBottom: Spacing.four },
});
