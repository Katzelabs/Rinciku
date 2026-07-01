import { useCallback, useEffect, useState } from 'react';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SearchX, SlidersHorizontal, Wallet } from 'lucide-react-native';

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
            <HeaderAddButton
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
          avgPerTransaction: t('summary.avgPerTransaction'),
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
            actionLabel={t('page.addIncome')}
            onAction={() => router.push('/(app)/(incomes)/new')}
          />
        )
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
                {group.label}
              </Text>
              <Text style={[styles.sectionSubtotal, { color: c.primary }]}>
                {group.subtotal > 0 ? '+' : ''}
                {formatCurrency(group.subtotal, base)}
              </Text>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              {group.rows.map((income, i) => {
                const name = income.category?.name;
                const note = income.note?.trim();
                const title = name ?? (note || t('form.uncategorized'));
                const subtitle =
                  name && note
                    ? note
                    : formatDate(new Date(income.occurred_at), 'p');
                return (
                  <TransactionRow
                    key={income.id}
                    icon={income.category?.icon}
                    color={income.category?.color}
                    title={title}
                    subtitle={subtitle}
                    amount={Number(income.amount)}
                    currency={income.currency as CurrencyCode}
                    sign='+'
                    amountColor={c.primary}
                    topBorder={i > 0}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/(incomes)/[id]',
                        params: { id: income.id },
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
