import { useCallback, useEffect, useState } from 'react';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus, Receipt, SearchX } from 'lucide-react-native';

import {
  convertToBase,
  formatDate,
  getPeriodRange,
  type CurrencyCode,
} from '@rinciku/core';

import { AppText, Notice, ScreenScroll } from '@/components/ui';
import { EmptyState } from '@/components/empty-state';
import { HeaderAction } from '@/components/header-action';
import { TransactionDayGroups } from '@/components/transaction-day-groups';
import { groupByDay } from '@/lib/transaction-groups';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  ExpenseFilters,
  type ListPeriod,
} from '@/features/expenses/components/expense-filters';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';

export default function ExpensesListScreen() {
  const { t } = useTranslation('expenses');
  const router = useRouter();
  const { profile } = useAuth();
  const {
    expenses,
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

  const [period, setPeriod] = useState<ListPeriod>('month');
  const [refreshing, setRefreshing] = useState(false);

  const onPeriodChange = useCallback(
    (next: ListPeriod) => {
      setPeriod(next);
      const range = getPeriodRange(next, {
        month_start_day: profile?.month_start_day ?? 1,
      });
      setDateRange(range.start, range.end);
    },
    [profile?.month_start_day, setDateRange]
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!loading) setRefreshing(false);
  }, [loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

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

  const initialLoading = loading && expenses.length === 0;

  return (
    <ScreenScroll onRefresh={onRefresh} refreshing={refreshing}>
      <Stack.Screen
        options={{
          title: t('list.title'),
          headerRight: () => (
            <HeaderAction
              systemImage='plus'
              icon={Plus}
              accessibilityLabel={t('common:nav.addExpense')}
              onPress={() => router.push('/(app)/(expenses)/new')}
            />
          ),
        }}
      />

      <AppText variant='body' color='mutedForeground'>
        {t('list.subtitle')}
      </AppText>

      <ExpenseFilters
        search={search}
        onSearchChange={setSearch}
        categoryIds={filters.categoryIds}
        onCategoryIdsChange={setCategoryIds}
        period={period}
        onPeriodChange={onPeriodChange}
      />

      {error ? <Notice tone='error'>{error}</Notice> : null}

      {initialLoading ? null : expenses.length === 0 ? (
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
        <TransactionDayGroups
          groups={groups}
          base={base}
          tone='expense'
          getRow={(expense) => {
            const name = expense.category?.name;
            const note = expense.note?.trim();
            return {
              id: expense.id,
              icon: expense.category?.icon,
              color: expense.category?.color,
              title: name ?? (note || t('common:categoryTag.uncategorized')),
              subtitle:
                name && note
                  ? note
                  : formatDate(new Date(expense.occurred_at), 'p'),
              amount: Number(expense.amount),
              currency: expense.currency as CurrencyCode,
              onPress: () =>
                router.push({
                  pathname: '/(app)/(expenses)/[id]',
                  params: { id: expense.id },
                }),
            };
          }}
        />
      )}
    </ScreenScroll>
  );
}
