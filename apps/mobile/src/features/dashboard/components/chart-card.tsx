import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CHART_HEIGHT = 200;

interface ChartCardProps {
  title: string;
  description: string;
  /** Show the skeleton placeholder instead of children. */
  loading?: boolean;
  /** Show the empty-state message instead of children (when there's no data). */
  empty?: boolean;
  /** Overrides the default "no spending in this range" empty copy. */
  emptyText?: string;
  children: ReactNode;
}

// Shared frame for the dashboard charts: title + description over a fixed-height
// plot area that swaps between a skeleton (loading), an empty state, and the
// chart itself. Ported from the web dashboard's ChartCard so both platforms read
// the same.
export function ChartCard({
  title,
  description,
  loading = false,
  empty = false,
  emptyText,
  children,
}: ChartCardProps) {
  const { t } = useTranslation('dashboard');
  const c = useTheme();

  return (
    <Card padding={Spacing.three} style={styles.card}>
      <View style={styles.header}>
        <AppText variant='heading'>{title}</AppText>
        <AppText variant='caption' color='mutedForeground'>
          {description}
        </AppText>
      </View>

      {loading ? (
        <View style={[styles.placeholder, { backgroundColor: c.muted }]} />
      ) : empty ? (
        <View
          style={[styles.placeholder, styles.empty, { borderColor: c.border }]}
        >
          <AppText variant='caption' color='mutedForeground'>
            {emptyText ?? t('charts.emptyDefault')}
          </AppText>
        </View>
      ) : (
        children
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  header: { gap: Spacing.half },
  placeholder: {
    height: CHART_HEIGHT,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  empty: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
