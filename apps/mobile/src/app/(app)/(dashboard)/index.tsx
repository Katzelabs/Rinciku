import { useCallback, useState } from 'react';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  getCycleLabel,
  getPeriodRange,
  type PeriodPreset,
} from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { AppText, Notice, ScreenScroll } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { HealthBadge } from '@/features/dashboard/components/health-badge';
import { PeriodPicker } from '@/features/dashboard/components/period-picker';
import { SummaryCards } from '@/features/dashboard/components/summary-cards';
import { TierBreakdown } from '@/features/dashboard/components/tier-breakdown';
import { useMonthlySummary } from '@/features/dashboard/hooks/use-monthly-summary';
import { usePeriodSpend } from '@/features/dashboard/hooks/use-period-spend';
import { useTheme } from '@/hooks/use-theme';

const PERIOD_LABEL_KEY: Record<PeriodPreset, string> = {
  today: 'period.today',
  week: 'period.thisWeek',
  month: 'period.thisMonth',
  custom: 'period.custom',
};

export default function DashboardScreen() {
  const c = useTheme();
  const { t } = useTranslation('dashboard');
  const router = useRouter();
  const { profile } = useAuth();
  const { summary, loading, error, refetch } = useMonthlySummary();

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
  const periodSpend = usePeriodSpend(range.start, range.end);
  const refetchPeriodSpend = periodSpend.refetch;

  // Refetch on focus so newly logged expenses reflect in the snapshot. Depend on
  // the stable `refetch` fns, not the `periodSpend` object — that object is
  // recreated every render, so depending on it would re-run this effect on every
  // render and loop (refetch → setState → render → refetch).
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchPeriodSpend();
    }, [refetch, refetchPeriodSpend])
  );

  return (
    <ScreenScroll
      refreshing={loading && summary !== null}
      onRefresh={() => {
        refetch();
        periodSpend.refetch();
      }}
    >
      <Stack.Screen
        options={{
          headerLeft: () => (
            <ProfileAvatar
              accessibilityLabel={t('common:nav.openSettings')}
              onPress={() => router.push('/(app)/(dashboard)/settings')}
            />
          ),
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

      {loading && summary === null ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : error ? (
        <Notice tone='error'>{error}</Notice>
      ) : summary ? (
        <>
          <AppText variant='label' color='mutedForeground'>
            {getCycleLabel(summary.cycle)}
          </AppText>
          <SummaryCards summary={summary} />
          <HealthBadge summary={summary} />
          <TierBreakdown
            tiers={summary.tiers}
            by_tier={periodSpend.spend?.by_tier ?? summary.by_tier}
            uncategorized_spent={
              periodSpend.spend?.uncategorized_spent ??
              summary.uncategorized_spent
            }
            base_currency={
              periodSpend.spend?.base_currency ?? summary.base_currency
            }
            periodLabel={t(PERIOD_LABEL_KEY[period])}
          />
        </>
      ) : (
        <View />
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: Spacing.five },
});
