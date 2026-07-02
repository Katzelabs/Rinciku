import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCycleLabel, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Card, Notice } from '@/components/ui';
import { CategoryBadge } from '@/components/category-badge';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { deleteBudget, upsertBudget } from '@/features/budgets/api';
import { BudgetMeter } from '@/features/budgets/components/budget-meter';
import { TargetModal } from '@/features/budgets/components/target-modal';
import { useBudgets } from '@/features/budgets/hooks/use-budgets';
import type { BudgetCategoryRow } from '@/features/budgets/types';
import { useTheme } from '@/hooks/use-theme';

// Lean v1 (M11): per-category targets + status meters for the current period.
// Renders a plain View so the host screen owns the scroll container (mirrors
// EssentialsManager / CategoriesManager); reused by the Manage tab.
// TODO(M11 follow-up): tier caps, copy-from-previous-month, period navigation.
export function BudgetsManager() {
  const c = useTheme();
  const { t } = useTranslation('budgets');
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useBudgets();
  const [editing, setEditing] = useState<BudgetCategoryRow | null>(null);

  async function handleSave(amount: number, currency: CurrencyCode) {
    if (!user || !data || !editing) {
      Alert.alert(t('toast.signInRequired'));
      return;
    }
    const { error } = await upsertBudget({
      user_id: user.id,
      category_id: editing.category.id,
      period_year: data.period.year,
      period_month: data.period.month,
      amount,
      currency,
    });
    if (error) {
      Alert.alert(t('toast.saveFailed'));
      return;
    }
    setEditing(null);
    refetch();
  }

  async function handleRemove() {
    if (!editing?.budgetId) return;
    const { error } = await deleteBudget(editing.budgetId);
    if (error) {
      Alert.alert(t('toast.removeFailed'));
      return;
    }
    setEditing(null);
    refetch();
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
        {t('page.subtitle')}
      </Text>
      {data ? (
        <Text style={[styles.cycle, { color: c.mutedForeground }]}>
          {t('page.cycle', { label: getCycleLabel(data.cycle) })}
        </Text>
      ) : null}

      {error ? <Notice tone='error'>{error}</Notice> : null}

      {isLoading || !data ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : (
        data.sections.map((section) => (
          <View key={section.tier?.id ?? '__untiered__'} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: section.tier?.color ?? c.mutedForeground },
                ]}
              />
              <Text style={[styles.tierName, { color: c.foreground }]}>
                {section.tier ? section.tier.name : t('page.untiered')}
              </Text>
            </View>

            {section.categories.length === 0 ? (
              <Text style={[styles.empty, { color: c.mutedForeground }]}>
                {t('page.noCategories')}
              </Text>
            ) : (
              <Card padding={0} style={styles.card}>
                {section.categories.map((row, i) => (
                  <Pressable
                    key={row.category.id}
                    accessibilityRole='button'
                    onPress={() => setEditing(row)}
                    style={({ pressed }) => [
                      styles.row,
                      i > 0 && {
                        borderTopColor: c.border,
                        borderTopWidth: StyleSheet.hairlineWidth,
                      },
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <CategoryBadge
                      icon={row.category.icon}
                      color={row.category.color}
                      size={32}
                    />
                    <View style={styles.rowBody}>
                      <Text
                        style={[styles.categoryName, { color: c.foreground }]}
                      >
                        {row.category.name}
                      </Text>
                      <BudgetMeter
                        spent={row.spent}
                        target={row.target}
                        pct={row.pct}
                        status={row.status}
                        base={data.base}
                      />
                    </View>
                  </Pressable>
                ))}
              </Card>
            )}
          </View>
        ))
      )}

      <TargetModal
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing
            ? t('dialog.categoryTarget', { name: editing.category.name })
            : ''
        }
        defaultAmount={editing?.targetRaw ?? null}
        currency={editing?.targetCurrency ?? data?.base ?? 'IDR'}
        onSave={handleSave}
        onRemove={editing?.budgetId ? handleRemove : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  subtitle: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  cycle: { fontFamily: Fonts.medium, fontSize: 13 },
  loader: { marginVertical: Spacing.four },
  section: { gap: Spacing.two },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  dot: { width: 10, height: 10, borderRadius: Radius.pill },
  tierName: { fontFamily: Fonts.semibold, fontSize: 16 },
  card: { paddingHorizontal: Spacing.three },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowBody: { flex: 1, gap: Spacing.two },
  categoryName: { fontFamily: Fonts.medium, fontSize: 15 },
});
