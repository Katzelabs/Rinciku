import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet } from 'react-native';

import {
  getPeriodRange,
  type CurrencyCode,
  type PeriodPreset,
} from '@rinciku/core';

import { ProfileAvatar } from '@/components/profile-avatar';
import { AppText, Notice, ScreenScroll } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { BudgetHero } from '@/features/dashboard/components/budget-hero';
import { CategoryBreakdownChart } from '@/features/dashboard/components/category-breakdown-chart';
import { ChartCard } from '@/features/dashboard/components/chart-card';
import { IncomeVsExpenseChart } from '@/features/dashboard/components/income-vs-expense-chart';
import { PeriodPicker } from '@/features/dashboard/components/period-picker';
import { SpendTrendChart } from '@/features/dashboard/components/spend-trend-chart';
import { SummaryCards } from '@/features/dashboard/components/summary-cards';
import { TopCategories } from '@/features/dashboard/components/top-categories';
import { useAnalytics } from '@/features/dashboard/hooks/use-analytics';
import { useMonthlySummary } from '@/features/dashboard/hooks/use-monthly-summary';
import { useTheme } from '@/hooks/use-theme';

const PERIOD_LABEL_KEY: Record<PeriodPreset, string> = {
  today: 'period.today',
  week: 'period.thisWeek',
  month: 'period.thisMonth',
  custom: 'period.custom',
};

const MS_PER_DAY = 86_400_000;

export default function DashboardScreen() {
  const c = useTheme();
  const { t } = useTranslation('dashboard');
  const router = useRouter();
  const { profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const { summary, refetch } = useMonthlySummary();

  const [period, setPeriod] = useState<PeriodPreset>('month');
  const [customFrom, setCustomFrom] = useState<Date>(
    () =>
      getPeriodRange('month', {
        month_start_day: profile?.month_start_day ?? 1,
      }).start
  );
  const [customTo, setCustomTo] = useState<Date>(
    () =>
      getPeriodRange('month', {
        month_start_day: profile?.month_start_day ?? 1,
      }).end
  );

  const range = getPeriodRange(
    period,
    { month_start_day: profile?.month_start_day ?? 1 },
    { customFrom, customTo }
  );
  const analytics = useAnalytics(range.start, range.end);
  const refetchAnalytics = analytics.refetch;

  // Refetch on focus so newly logged expenses reflect in both the period
  // analytics and the monthly budget section. Depend on the stable refetch fns,
  // not the analytics object (recreated every render — depending on it would
  // loop: refetch → setState → render → refetch).
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchAnalytics();
    }, [refetch, refetchAnalytics])
  );

  // Period totals derived from the trend, exactly like the web dashboard.
  const trend = analytics.data?.trend ?? [];
  const breakdown = analytics.data?.breakdown ?? { byCategory: [], byTier: [] };
  const totalIncome = trend.reduce((sum, p) => sum + p.income, 0);
  const totalSpent = trend.reduce((sum, p) => sum + p.spent, 0);
  const days = Math.max(
    1,
    Math.round((range.end.getTime() - range.start.getTime()) / MS_PER_DAY)
  );

  const hasTrend = trend.some((p) => p.spent > 0 || p.income > 0);
  const hasBreakdown =
    breakdown.byCategory.length > 0 || breakdown.byTier.length > 0;

  const firstLoad = analytics.loading && analytics.data === null;

  return (
    <ScreenScroll
      refreshing={analytics.loading && analytics.data !== null}
      onRefresh={() => {
        refetch();
        refetchAnalytics();
      }}
    >
      <Stack.Screen
        options={{
          unstable_headerLeftItems: () => [
            {
              type: 'custom',
              hidesSharedBackground: true,
              element: (
                <ProfileAvatar
                  accessibilityLabel={t('common:nav.openSettings')}
                  onPress={() => router.push('/(app)/(dashboard)/settings')}
                />
              ),
            },
          ],
          headerRight: () => (
            <PeriodPicker
              period={period}
              customFrom={customFrom}
              customTo={customTo}
              onApply={(next, from, to) => {
                setPeriod(next);
                setCustomFrom(from);
                setCustomTo(to);
              }}
            />
          ),
        }}
      />

      {summary ? <BudgetHero summary={summary} /> : null}

      {firstLoad ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : analytics.error ? (
        <Notice tone='error'>{analytics.error}</Notice>
      ) : (
        <>
          <AppText variant='label' color='mutedForeground'>
            {t(PERIOD_LABEL_KEY[period])}
          </AppText>
          <SummaryCards
            income={totalIncome}
            spent={totalSpent}
            days={days}
            base={base}
          />

          {hasBreakdown ? (
            <TopCategories items={breakdown.byCategory} base={base} />
          ) : null}

          <ChartCard
            title={t('charts.trend.title')}
            description={t('charts.trend.description')}
            loading={analytics.loading}
            empty={!hasTrend}
          >
            <SpendTrendChart data={trend} base={base} />
          </ChartCard>

          <ChartCard
            title={t('charts.breakdown.title')}
            description={t('charts.breakdown.description')}
            loading={analytics.loading}
            empty={!hasBreakdown}
          >
            <CategoryBreakdownChart data={breakdown} base={base} />
          </ChartCard>

          <ChartCard
            title={t('charts.incomeVsExpense.title')}
            description={t('charts.incomeVsExpense.description')}
            loading={analytics.loading}
            empty={!hasTrend}
          >
            <IncomeVsExpenseChart data={trend} base={base} />
          </ChartCard>
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: Spacing.five },
});
