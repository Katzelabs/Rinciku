import { useCallback, useEffect, useState } from 'react';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Receipt, SearchX } from 'lucide-react-native';

import {
  convertToBase,
  formatCurrency,
  formatDate,
  type CurrencyCode,
} from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { EmptyState } from '@/components/empty-state';
import { HeaderAddButton } from '@/components/header-add-button';
import { TransactionRow } from '@/components/transaction-row';
import { TransactionSummaryHeader } from '@/components/transaction-summary-header';
import { groupByDay } from '@/lib/transaction-groups';
import { Notice } from '@/features/auth/components/notice';
import { ExpenseFilters } from '@/features/expenses/components/expense-filters';
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

  const [refreshing, setRefreshing] = useState(false);

  // Refetch when returning from the new/detail screens so a just-created or
  // edited expense shows up.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    // Turn the pull-to-refresh spinner off once the refetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!loading) setRefreshing(false);
  }, [loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const days = Math.max(
    1,
    Math.round((filters.to.getTime() - filters.from.getTime()) / DAY_MS) + 1
  );

  const filtersActive =
    search.trim().length > 0 || filters.categoryIds.length > 0;

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategoryIds([]);
  }, [setSearch, setCategoryIds]);

  const groups = groupByDay(
    expenses,
    (row) => new Date(row.occurred_at),
    (row) =>
      convertToBase(Number(row.amount), row.currency as CurrencyCode, base)
        .amount_base,
    {
      today: t('common:time.today'),
      yesterday: t('common:time.yesterday'),
      format: (d) => formatDate(d, 'PP'),
    }
  );

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={c.mutedForeground}
        />
      }
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

      <TransactionSummaryHeader
        total={total}
        count={count}
        days={days}
        base={base}
        tone='expense'
        labels={{
          total: t('summary.totalSpent'),
          transactions: t('summary.transactions'),
          avgPerTransaction: t('summary.avgPerTransaction'),
          avgPerDay: t('summary.avgPerDay'),
          overDays: t('summary.overDays', { count: days }),
        }}
      />

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

      {loading && expenses.length === 0 ? null : expenses.length === 0 ? (
        filtersActive ? (
          <EmptyState
            icon={SearchX}
            title={t('table.noResults')}
            actionLabel={t('common:actions.clearFilters')}
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            icon={Receipt}
            title={t('table.empty')}
            subtitle={t('page.subtitle')}
            actionLabel={t('page.addExpense')}
            onAction={() => router.push('/(app)/(expenses)/new')}
          />
        )
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
                {group.label}
              </Text>
              <Text style={[styles.sectionSubtotal, { color: c.foreground }]}>
                {formatCurrency(group.subtotal, base)}
              </Text>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              {group.rows.map((expense, i) => {
                const name = expense.category?.name;
                const note = expense.note?.trim();
                const title =
                  name ?? (note || t('common:categoryTag.uncategorized'));
                const subtitle =
                  name && note
                    ? note
                    : formatDate(new Date(expense.occurred_at), 'p');
                return (
                  <TransactionRow
                    key={expense.id}
                    icon={expense.category?.icon}
                    color={expense.category?.color}
                    title={title}
                    subtitle={subtitle}
                    amount={Number(expense.amount)}
                    currency={expense.currency as CurrencyCode}
                    topBorder={i > 0}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/(expenses)/[id]',
                        params: { id: expense.id },
                      })
                    }
                  />
                );
              })}
            </View>
          </View>
        ))
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
  section: { gap: Spacing.one },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  sectionLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtotal: { fontFamily: Fonts.semibold, fontSize: 13 },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
});
