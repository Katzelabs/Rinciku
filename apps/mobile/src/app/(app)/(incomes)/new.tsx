import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { IncomeForm } from '@/features/incomes/components/income-form';
import { useTheme } from '@/hooks/use-theme';

// New-income modal, launched from the Incomes header "+". On success the list
// refetches on focus (see the incomes index screen).
export default function NewIncomeScreen() {
  const c = useTheme();
  const router = useRouter();
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <IncomeForm mode='create' onSuccess={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
});
