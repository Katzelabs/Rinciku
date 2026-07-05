import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { AppText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useTheme } from '@/hooks/use-theme';

// New-expense modal, launched from the Expenses header "+". On success the list
// refetches on focus (see the expenses index screen). Keyboard-aware so lower
// fields aren't hidden behind the keyboard.
export default function NewExpenseScreen() {
  const c = useTheme();
  const router = useRouter();
  const { t } = useTranslation('expenses');
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={styles.content}
      >
        <AppText variant='caption' color='mutedForeground' style={styles.intro}>
          {t('page.createDescription')}
        </AppText>
        <ExpenseForm mode='create' onSuccess={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
  intro: { marginBottom: Spacing.four },
});
