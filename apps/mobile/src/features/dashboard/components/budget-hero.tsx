import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { formatCurrency, getCycleLengthDays } from '@rinciku/core';
import { computeHealth, type HealthStatus } from '@rinciku/domain/dashboard';

import { AppText, Card } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import type { MonthlySummary } from '@/features/dashboard/types';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

// The dashboard's north-star: one ink "safe to spend" number for the current
// cycle — the discretionary money left after reserving still-unpaid essentials.
// Kept minimal (number → pace → meter); color comes from a soft status wash on
// the card itself so it never reads monotone. Status color is meaningful, not
// decorative: healthy green, amber watch, red over.
export function BudgetHero({ summary }: { summary: MonthlySummary }) {
  const { t } = useTranslation('dashboard');
  const c = useTheme();
  const base = summary.base_currency;

  const totalDays = getCycleLengthDays(summary.cycle);
  const daysElapsed = Math.max(0, totalDays - summary.days_left);
  const status = computeHealth({
    remaining: summary.remaining,
    days_left: summary.days_left,
    baseline_uncovered: summary.baseline_uncovered,
    spent: summary.spent_total,
    days_elapsed: daysElapsed,
  });
  const accent = STATUS_ACCENT(c)[status];

  // Discretionary money left after setting aside essentials still to be paid.
  const safeToSpend = summary.remaining - summary.baseline_uncovered;
  const negative = safeToSpend < 0;
  const perDay =
    summary.days_left > 0 ? Math.max(0, safeToSpend) / summary.days_left : 0;

  const ratio =
    summary.expected_monthly_income > 0
      ? Math.min(1, summary.spent_total / summary.expected_monthly_income)
      : 0;

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: withAlpha(accent, '14'),
          borderColor: withAlpha(accent, '33'),
        },
      ]}
    >
      <View style={styles.headerRow}>
        <AppText variant='amountSmall' color='mutedForeground'>
          {t('hero.safeToSpend')}
        </AppText>
        <View
          style={[styles.chip, { backgroundColor: withAlpha(accent, '26') }]}
        >
          <AppText variant='amountSmall' style={{ color: accent }}>
            {t(`health.status.${STATUS_KEY[status]}`)}
          </AppText>
        </View>
      </View>

      <AppText
        variant='hero'
        style={[styles.hero, negative && { color: c.destructive }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {formatCurrency(safeToSpend, base)}
      </AppText>

      {!negative && summary.days_left > 0 ? (
        <AppText variant='caption' color='mutedForeground'>
          {t('hero.perDay', {
            amount: formatCurrency(perDay, base),
            count: summary.days_left,
          })}
        </AppText>
      ) : null}

      <View style={styles.meter}>
        <View
          style={[styles.track, { backgroundColor: withAlpha(accent, '26') }]}
        >
          <View
            style={[
              styles.fill,
              { width: `${Math.round(ratio * 100)}%`, backgroundColor: accent },
            ]}
          />
        </View>
        <View style={styles.meterEnds}>
          <AppText variant='caption' color='mutedForeground' numberOfLines={1}>
            {t('hero.spent', {
              amount: formatCurrency(summary.spent_total, base),
            })}
          </AppText>
          <AppText variant='caption' color='mutedForeground' numberOfLines={1}>
            {formatCurrency(summary.expected_monthly_income, base)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const STATUS_KEY: Record<HealthStatus, 'onTrack' | 'watch' | 'over'> = {
  'on-track': 'onTrack',
  watch: 'watch',
  over: 'over',
};

function STATUS_ACCENT(
  c: ReturnType<typeof useTheme>
): Record<HealthStatus, string> {
  return {
    'on-track': c.positive,
    watch: c.warningForeground,
    over: c.destructive,
  };
}

const styles = StyleSheet.create({
  card: { gap: Spacing.one },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  hero: { marginTop: Spacing.half },
  meter: { gap: Spacing.one, marginTop: Spacing.two },
  track: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Radius.pill },
  meterEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
