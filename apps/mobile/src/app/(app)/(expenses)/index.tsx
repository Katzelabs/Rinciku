import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Receipt } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formatDate, getPeriodRange, type CurrencyCode } from '@rinciku/core';

import { EmptyState } from '@/components/empty-state';
import { PeriodTabs } from '@/components/period-tabs';
import type { SegmentedOption } from '@/components/segmented';
import { TransactionRow } from '@/components/transaction-row';
import { TransactionSummaryHeader } from '@/components/transaction-summary-header';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Notice } from '@/features/auth/components/notice';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { ListPeriod } from '@/features/expenses/components/expense-filters';
import { ExpenseHeaderActions } from '@/features/expenses/components/expense-header-actions';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';

const DAY_MS = 24 * 60 * 60 * 1000;
// How many recent expenses to preview on the overview before "See all".
const PREVIEW_COUNT = 6;

export default function ExpensesScreen() {
  const c = useTheme();
  const { t } = useTranslation('expenses');
  const router = useRouter();
  const { profile } = useAuth();
  const {
    expenses,
    count,
    total,
    base,
    loading,
    error,
    filters,
    setDateRange,
    refetch,
  } = useExpenses();

  const [period, setPeriod] = useState<ListPeriod>('month');
  const [refreshing, setRefreshing] = useState(false);

  const periodOptions = useMemo<SegmentedOption<ListPeriod>[]>(
    () => [
      { key: 'today', label: t('period.today') },
      { key: 'week', label: t('period.thisWeek') },
      { key: 'month', label: t('period.thisMonth') },
    ],
    [t]
  );

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

  // Refetch when returning from the new/detail/list screens so a just-created or
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

  const preview = expenses.slice(0, PREVIEW_COUNT);
  const initialLoading = loading && expenses.length === 0;

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
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
          headerTransparent: true,
          unstable_headerRightItems: () => [
            {
              type: 'custom',
              hidesSharedBackground: true,
              element: (
                <ExpenseHeaderActions
                  onAdd={() => router.push('/(app)/(expenses)/new')}
                  onCapture={() => router.push('/(app)/(expenses)/capture')}
                />
              ),
            },
          ],
        }}
      />

      <PeriodTabs
        options={periodOptions}
        value={period}
        onChange={onPeriodChange}
      />

      <View style={styles.block}>
        <Text style={[styles.heading, { color: c.foreground }]}>
          {t('section.summary')}
        </Text>
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
      </View>

      <View style={styles.block}>
        <View style={styles.headingRow}>
          <Text style={[styles.heading, { color: c.foreground }]}>
            {t('section.recentActivity')}
          </Text>
          <Pressable
            accessibilityRole='button'
            hitSlop={8}
            onPress={() => router.push('/(app)/(expenses)/list')}
            style={({ pressed }) => [
              styles.seeAll,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.seeAllText, { color: c.primary }]}>
              {t('section.seeAll')}
            </Text>
            <ChevronRight size={16} color={c.primary} />
          </Pressable>
        </View>

        {error ? <Notice tone='error'>{error}</Notice> : null}

        {initialLoading ? null : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t('table.empty')}
            subtitle={t('page.subtitle')}
            actionLabel={t('page.addExpense')}
            onAction={() => router.push('/(app)/(expenses)/new')}
          />
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            {preview.map((expense, i) => {
              const name = expense.category?.name;
              const note = expense.note?.trim();
              const dateStr = formatDate(
                new Date(expense.occurred_at),
                'MMM d'
              );
              const title =
                note || name || t('common:categoryTag.uncategorized');
              const subtitle = note && name ? `${name} • ${dateStr}` : dateStr;
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
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  block: { gap: Spacing.two },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { fontFamily: Fonts.bold, fontSize: 22 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontFamily: Fonts.semibold, fontSize: 14 },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
});
