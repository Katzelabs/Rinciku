import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCycleLabel, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Notice } from '@/features/auth/components/notice';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { deleteBudget, upsertBudget } from '@/features/budgets/api';
import { BudgetMeter } from '@/features/budgets/components/budget-meter';
import { TargetModal } from '@/features/budgets/components/target-modal';
import { useBudgets } from '@/features/budgets/hooks/use-budgets';
import type { BudgetCategoryRow } from '@/features/budgets/types';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { useTheme } from '@/hooks/use-theme';

// Lean v1 (M11): per-category targets + status meters for the current period.
// TODO(M11 follow-up): tier caps, copy-from-previous-month, period navigation.
export default function BudgetsScreen() {
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
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={styles.content}
    >
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
              <View
                style={[
                  styles.card,
                  { backgroundColor: c.card, borderColor: c.border },
                ]}
              >
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
                    <View
                      style={[
                        styles.iconBadge,
                        {
                          backgroundColor: `${row.category.color ?? '#8d8d8d'}22`,
                        },
                      ]}
                    >
                      <CategoryIcon
                        name={row.category.icon}
                        size={16}
                        color={row.category.color ?? c.foreground}
                      />
                    </View>
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
              </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
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
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
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
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: Spacing.two },
  categoryName: { fontFamily: Fonts.medium, fontSize: 15 },
});
