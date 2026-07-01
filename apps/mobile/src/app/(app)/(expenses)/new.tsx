import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useTheme } from '@/hooks/use-theme';

// New-expense modal, launched from the GlassFab. On success the list refetches
// on focus (see the expenses index screen).
export default function NewExpenseScreen() {
  const c = useTheme();
  const router = useRouter();
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <ExpenseForm mode='create' onSuccess={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
});
