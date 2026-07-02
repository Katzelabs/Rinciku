import { useCallback, useEffect, useState } from 'react';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Plus, SearchX, SlidersHorizontal, Wallet } from 'lucide-react-native';

import {
  convertToBase,
  formatDate,
  type CurrencyCode,
} from '@rinciku/core';

import { Notice, ScreenScroll } from '@/components/ui';
import { EmptyState } from '@/components/empty-state';
import { HeaderAction } from '@/components/header-action';
import { TransactionDayGroups } from '@/components/transaction-day-groups';
import { TransactionSummaryHeader } from '@/components/transaction-summary-header';
import { groupByDay } from '@/lib/transaction-groups';
import { IncomeFilters } from '@/features/incomes/components/income-filters';
import { useIncomes } from '@/features/incomes/hooks/use-incomes';
import { useTheme } from '@/hooks/use-theme';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function IncomesScreen() {
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const router = useRouter();
  const {
    incomes,
    count,
    total,
    base,
    loading,
    error,
    filters,
    search,
    setSearch,
    setDateRange,
    setSourceIds,
    refetch,
  } = useIncomes();

  const [refreshing, setRefreshing] = useState(false);

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
    search.trim().length > 0 || filters.sourceIds.length > 0;

  const clearFilters = useCallback(() => {
    setSearch('');
    setSourceIds([]);
  }, [setSearch, setSourceIds]);

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

  return (
    <ScreenScroll onRefresh={onRefresh} refreshing={refreshing}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={t('page.manageSources')}
              onPress={() => router.push('/(app)/(incomes)/sources')}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <SlidersHorizontal size={22} color={c.primary} />
            </Pressable>
          ),
          headerRight: () => (
            <HeaderAction
              systemImage='plus'
              icon={Plus}
              accessibilityLabel={t('page.addIncome')}
              onPress={() => router.push('/(app)/(incomes)/new')}
            />
          ),
        }}
      />

      <TransactionSummaryHeader
        total={total}
        count={count}
        days={days}
        base={base}
        tone='income'
        labels={{
          total: t('summary.totalIncome'),
          transactions: t('summary.transactions'),
          avgPerDay: t('summary.avgPerDay'),
          overDays: t('summary.overDays', { count: days }),
        }}
      />

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

      {loading && incomes.length === 0 ? null : incomes.length === 0 ? (
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
            };
          }}
        />
      )}
    </ScreenScroll>
  );
}
