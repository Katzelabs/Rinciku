import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Receipt, SearchX } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { convertToBase, formatDate, type CurrencyCode } from '@rinciku/core';

import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { TransactionDayGroups } from '@/components/transaction-day-groups';
import { TransactionListSkeleton } from '@/components/transaction-list-skeleton';
import { AppText, Notice, ScreenScroll } from '@/components/ui';
import { deleteExpense } from '@/features/expenses/api';
import { ExpenseFilters } from '@/features/expenses/components/expense-filters';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { groupByDay } from '@/lib/transaction-groups';

// The transactions list pages the current cycle 12 rows at a time.
const PAGE_SIZE = 12;

export default function ExpensesListScreen() {
  const { t } = useTranslation('expenses');
  const router = useRouter();
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
    page,
    pageCount,
    setPage,
    refetch,
  } = useExpenses({ pageSize: PAGE_SIZE });

  const [refreshing, setRefreshing] = useState(false);

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

  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert(t('page.deleteTitle'), t('page.deleteDescription'), [
        { text: t('common:actions.cancel'), style: 'cancel' },
        {
          text: t('common:actions.delete'),
          style: 'destructive',
          onPress: async () => {
            const { error: delError } = await deleteExpense(id);
            if (delError) {
              Alert.alert(t('toast.deleteError'));
              return;
            }
            refetch();
          },
        },
      ]);
    },
    [t, refetch]
  );

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
        from={filters.from}
        to={filters.to}
        onRangeChange={setDateRange}
      />

      {error ? <Notice tone='error'>{error}</Notice> : null}

      {initialLoading ? (
        <TransactionListSkeleton />
      ) : expenses.length === 0 ? (
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
              onDelete: () => confirmDelete(expense.id),
              deleteLabel: t('common:actions.delete'),
            };
          }}
        />
      )}

      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </ScreenScroll>
  );
}
