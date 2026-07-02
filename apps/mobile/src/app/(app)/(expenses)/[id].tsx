import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { formatCurrency, formatDate, type CurrencyCode } from '@rinciku/core';

import { Fonts, Spacing } from '@/constants/theme';
import {
  AppText,
  Button,
  Card,
  Notice,
  ScreenScroll,
  Sheet,
} from '@/components/ui';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { deleteExpense, getExpense } from '@/features/expenses/api';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import type { ExpenseWithRelations } from '@/features/expenses/types';
import { useTheme } from '@/hooks/use-theme';

export default function ExpenseDetailScreen() {
  const c = useTheme();
  const { t } = useTranslation('expenses');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [expense, setExpense] = useState<ExpenseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    void getExpense(id).then((res) => {
      if (cancelled) return;
      setExpense(res.data);
      setError(res.error?.message ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useFocusEffect(load);

  function confirmDelete() {
    if (!id) return;
    Alert.alert(t('page.deleteTitle'), t('page.deleteDescription'), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('common:actions.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error: delError } = await deleteExpense(id);
          if (delError) {
            Alert.alert(t('toast.deleteError'));
            return;
          }
          router.back();
        },
      },
    ]);
  }

  return (
    <ScreenScroll gap={Spacing.four}>
      {loading ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : error || !expense ? (
        <Notice tone='error'>
          {error ?? t('page.loadError', { error: '' })}
        </Notice>
      ) : (
        <>
          <View style={styles.amountBlock}>
            <AppText
              variant='hero'
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {formatCurrency(
                Number(expense.amount),
                expense.currency as CurrencyCode
              )}
            </AppText>
            <AppText variant='body' color='mutedForeground'>
              {formatDate(new Date(expense.occurred_at), 'PPP')}
            </AppText>
          </View>

          <Card padding={0} style={styles.card}>
            <DetailRow label={t('detail.category')}>
              {expense.category ? (
                <View style={styles.categoryValue}>
                  <CategoryIcon
                    name={expense.category.icon}
                    size={16}
                    color={expense.category.color ?? c.foreground}
                  />
                  <Text style={[styles.value, { color: c.foreground }]}>
                    {expense.category.name}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.value, { color: c.mutedForeground }]}>
                  {t('common:categoryTag.uncategorized')}
                </Text>
              )}
            </DetailRow>
            <DetailRow label={t('detail.note')} topBorder>
              <Text
                style={[
                  styles.value,
                  { color: expense.note ? c.foreground : c.mutedForeground },
                ]}
              >
                {expense.note?.trim()
                  ? expense.note.trim()
                  : t('detail.noNote')}
              </Text>
            </DetailRow>
          </Card>

          <View style={styles.actions}>
            <Button
              variant='outline'
              label={t('detail.edit')}
              onPress={() => setEditOpen(true)}
              style={styles.actionButton}
            />
            <Button
              variant='destructive'
              label={t('common:actions.delete')}
              onPress={confirmDelete}
              style={styles.actionButton}
            />
          </View>
        </>
      )}

      <Sheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('edit.title')}
      >
        {expense ? (
          <ExpenseForm
            mode='edit'
            defaultValues={{
              id: expense.id,
              amount: Number(expense.amount),
              currency: expense.currency as CurrencyCode,
              category_id: expense.category_id ?? '',
              occurred_at: new Date(expense.occurred_at),
              note: expense.note ?? '',
            }}
            onSuccess={() => {
              setEditOpen(false);
              load();
            }}
          />
        ) : null}
      </Sheet>
    </ScreenScroll>
  );
}

function DetailRow({
  label,
  topBorder,
  children,
}: {
  label: string;
  topBorder?: boolean;
  children: React.ReactNode;
}) {
  const c = useTheme();
  return (
    <View
      style={[
        styles.detailRow,
        topBorder && {
          borderTopColor: c.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Text style={[styles.label, { color: c.mutedForeground }]}>{label}</Text>
      <View style={styles.detailValue}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: Spacing.five },
  amountBlock: { alignItems: 'center', gap: Spacing.one },
  card: { paddingHorizontal: Spacing.three },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  label: { fontFamily: Fonts.medium, fontSize: 14 },
  detailValue: { flexShrink: 1, alignItems: 'flex-end' },
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  value: { fontFamily: Fonts.medium, fontSize: 15, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: Spacing.three },
  actionButton: { flex: 1 },
});
