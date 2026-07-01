import { useCallback } from 'react';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { HeaderAddButton } from '@/components/header-add-button';
import { Notice } from '@/features/auth/components/notice';
import { ExpenseFilters } from '@/features/expenses/components/expense-filters';
import { ExpenseListItem } from '@/features/expenses/components/expense-list-item';
import { ExpenseSummary } from '@/features/expenses/components/expense-summary';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function ExpensesScreen() {
  const c = useTheme();
  const { t } = useTranslation('expenses');
  const router = useRouter();
  const {
    expenses,
    count,
    total,
    base,
    loading,
    error,
    filters,
    search,
    setSearch,
    setDateRange,
    setCategoryIds,
    refetch,
  } = useExpenses();

  // Refetch when returning from the new/detail screens so a just-created or
  // edited expense shows up.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const days = Math.max(
    1,
    Math.round((filters.to.getTime() - filters.from.getTime()) / DAY_MS) + 1
  );

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderAddButton
              accessibilityLabel={t('common:nav.addExpense')}
              onPress={() => router.push('/(app)/(expenses)/new')}
            />
          ),
        }}
      />

      <ExpenseSummary total={total} count={count} base={base} days={days} />

      <ExpenseFilters
        search={search}
        onSearchChange={setSearch}
        categoryIds={filters.categoryIds}
        onCategoryIdsChange={setCategoryIds}
        from={filters.from}
        to={filters.to}
        onDateRangeChange={setDateRange}
      />

      {error ? <Notice tone='error'>{error}</Notice> : null}

      {loading ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : expenses.length === 0 ? (
        <Text style={[styles.empty, { color: c.mutedForeground }]}>
          {t('table.empty')}
        </Text>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {expenses.map((expense, i) => (
            <ExpenseListItem
              key={expense.id}
              expense={expense}
              topBorder={i > 0}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(expenses)/[id]',
                  params: { id: expense.id },
                })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  loader: { marginVertical: Spacing.four },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
});
