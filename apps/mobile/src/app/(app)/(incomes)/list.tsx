import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { SearchX, Wallet } from '@/lib/icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { convertToBase, formatDate, type CurrencyCode } from '@rinciku/core';

import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { TransactionDayGroups } from '@/components/transaction-day-groups';
import { TransactionListSkeleton } from '@/components/transaction-list-skeleton';
import { AppText, Notice, ScreenScroll } from '@/components/ui';
import { deleteIncome } from '@/features/incomes/api';
import { IncomeFilters } from '@/features/incomes/components/income-filters';
import { useIncomes } from '@/features/incomes/hooks/use-incomes';
import { groupByDay } from '@/lib/transaction-groups';

// The transactions list pages the current cycle 12 rows at a time.
const PAGE_SIZE = 12;

export default function IncomesListScreen() {
  const { t } = useTranslation('incomes');
  const router = useRouter();
  const {
    incomes,
    base,
    loading,
    error,
    filters,
    search,
    setSearch,
    setDateRange,
    setSourceIds,
    page,
    pageCount,
    setPage,
    refetch,
  } = useIncomes({ pageSize: PAGE_SIZE });

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
    search.trim().length > 0 || filters.sourceIds.length > 0;

  const clearFilters = useCallback(() => {
    setSearch('');
    setSourceIds([]);
  }, [setSearch, setSourceIds]);

  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert(t('page.deleteTitle'), t('page.deleteDescription'), [
        { text: t('common:actions.cancel'), style: 'cancel' },
        {
          text: t('common:actions.delete'),
          style: 'destructive',
          onPress: async () => {
            const { error: delError } = await deleteIncome(id);
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
    incomes,
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

  const initialLoading = loading && incomes.length === 0;

  return (
    <ScreenScroll onRefresh={onRefresh} refreshing={refreshing}>
      <Stack.Screen options={{ title: t('list.title') }} />

      <AppText variant='body' color='mutedForeground'>
        {t('list.subtitle')}
      </AppText>

      <IncomeFilters
        search={search}
        onSearchChange={setSearch}
        sourceIds={filters.sourceIds}
        onSourceIdsChange={setSourceIds}
        from={filters.from}
        to={filters.to}
        onDateRangeChange={setDateRange}
      />

      {error ? <Notice tone='error'>{error}</Notice> : null}

      {initialLoading ? (
        <TransactionListSkeleton />
      ) : incomes.length === 0 ? (
        filtersActive ? (
          <EmptyState
            icon={SearchX}
            title={t('table.noResults')}
            actionLabel={t('common:actions.clearFilters')}
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            icon={Wallet}
            title={t('table.empty')}
            subtitle={t('page.subtitle')}
          />
        )
      ) : (
        <TransactionDayGroups
          groups={groups}
          base={base}
          tone='income'
          getRow={(income) => {
            const name = income.category?.name;
            const note = income.note?.trim();
            return {
              id: income.id,
              icon: income.category?.icon,
              color: income.category?.color,
              title: name ?? (note || t('form.uncategorized')),
              subtitle:
                name && note
                  ? note
                  : formatDate(new Date(income.occurred_at), 'p'),
              amount: Number(income.amount),
              currency: income.currency as CurrencyCode,
              onPress: () =>
                router.push({
                  pathname: '/(app)/(incomes)/[id]',
                  params: { id: income.id },
                }),
              onDelete: () => confirmDelete(income.id),
              deleteLabel: t('common:actions.delete'),
            };
          }}
        />
      )}

      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </ScreenScroll>
  );
}
