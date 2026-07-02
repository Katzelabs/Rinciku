import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDate, getPeriodRange, type CurrencyCode } from '@rinciku/core';

import { EmptyState } from '@/components/empty-state';
import { PeriodTabs } from '@/components/period-tabs';
import type { SegmentedOption } from '@/components/segmented';
import { TransactionRow } from '@/components/transaction-row';
import { TransactionSummaryHeader } from '@/components/transaction-summary-header';
import {
  AppText,
  Card,
  Notice,
  ScreenScroll,
  SectionHeader,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { ListPeriod } from '@/features/expenses/components/expense-filters';
import { useIncomes } from '@/features/incomes/hooks/use-incomes';
import { useTheme } from '@/hooks/use-theme';

const DAY_MS = 24 * 60 * 60 * 1000;
// How many recent incomes to preview on the overview before "See all".
const PREVIEW_COUNT = 6;

export default function IncomesScreen() {
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const router = useRouter();
  const { profile } = useAuth();
  const {
    incomes,
    count,
    total,
    base,
    loading,
    error,
    filters,
    setDateRange,
    refetch,
  } = useIncomes({ pageSize: PREVIEW_COUNT });

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

  // Refetch when returning from the new/detail/list/sources screens so a
  // just-created or edited income shows up.
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

  const preview = incomes.slice(0, PREVIEW_COUNT);
  const initialLoading = loading && incomes.length === 0;

  return (
    <ScreenScroll gap={Spacing.four} refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              label: `+ ${t('common:actions.add')}`,
              type: 'button',
              tintColor: c.primary,
              variant: 'prominent',
              sharesBackground: false,
              onPress: () => router.push('/(app)/(incomes)/new'),
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
      </View>

      <View style={styles.block}>
        <SectionHeader
          variant='title'
          title={t('section.recentActivity')}
          right={
            <Pressable
              accessibilityRole='button'
              hitSlop={8}
              onPress={() => router.push('/(app)/(incomes)/list')}
              style={({ pressed }) => [
                styles.seeAll,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <AppText variant='label' color='primary'>
                {t('section.seeAll')}
              </AppText>
              <ChevronRight size={16} color={c.primary} />
            </Pressable>
          }
        />

        {error ? <Notice tone='error'>{error}</Notice> : null}

        {initialLoading ? null : incomes.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={t('table.empty')}
            subtitle={t('page.subtitle')}
          />
        ) : (
          <Card padding={0} style={styles.card}>
            {preview.map((income, i) => {
              const name = income.category?.name;
              const note = income.note?.trim();
              const dateStr = formatDate(new Date(income.occurred_at), 'MMM d');
              const title = note || name || t('form.uncategorized');
              const subtitle = note && name ? `${name} • ${dateStr}` : dateStr;
              return (
                <TransactionRow
                  key={income.id}
                  icon={income.category?.icon}
                  color={income.category?.color}
                  title={title}
                  subtitle={subtitle}
                  amount={Number(income.amount)}
                  currency={income.currency as CurrencyCode}
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
          </Card>
        )}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.two },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  card: { paddingHorizontal: Spacing.three },
});
