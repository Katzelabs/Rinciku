import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCycleLabel } from '@rinciku/core';

import { Fonts, Spacing } from '@/constants/theme';
import { Notice } from '@/features/auth/components/notice';
import { HealthBadge } from '@/features/dashboard/components/health-badge';
import { SummaryCards } from '@/features/dashboard/components/summary-cards';
import { TierBreakdown } from '@/features/dashboard/components/tier-breakdown';
import { useMonthlySummary } from '@/features/dashboard/hooks/use-monthly-summary';
import { useTheme } from '@/hooks/use-theme';

export default function DashboardScreen() {
  const c = useTheme();
  const { summary, loading, error, refetch } = useMonthlySummary();

  // Refetch on focus so newly logged expenses reflect in the snapshot.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading && summary !== null}
          onRefresh={refetch}
          tintColor={c.primary}
        />
      }
    >
      {loading && summary === null ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : error ? (
        <Notice tone='error'>{error}</Notice>
      ) : summary ? (
        <>
          <Text style={[styles.cycle, { color: c.mutedForeground }]}>
            {getCycleLabel(summary.cycle)}
          </Text>
          <SummaryCards summary={summary} />
          <HealthBadge summary={summary} />
          <TierBreakdown summary={summary} />
        </>
      ) : (
        <View />
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
  loader: { marginVertical: Spacing.five },
  cycle: { fontFamily: Fonts.medium, fontSize: 14 },
});
