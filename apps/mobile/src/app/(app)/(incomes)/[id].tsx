import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { formatCurrency, formatDate, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { Button } from '@/features/auth/components/button';
import { Notice } from '@/features/auth/components/notice';
import { deleteIncome, getIncome } from '@/features/incomes/api';
import { IncomeForm } from '@/features/incomes/components/income-form';
import type { IncomeWithRelations } from '@/features/incomes/types';
import { useTheme } from '@/hooks/use-theme';

export default function IncomeDetailScreen() {
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [income, setIncome] = useState<IncomeWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    void getIncome(id).then((res) => {
      if (cancelled) return;
      setIncome(res.data);
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
          const { error: delError } = await deleteIncome(id);
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
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={styles.content}
    >
      {loading ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : error || !income ? (
        <Notice tone='error'>
          {error ?? t('page.loadError', { error: '' })}
        </Notice>
      ) : (
        <>
          <View style={styles.amountBlock}>
            <Text
              style={[styles.amount, { color: c.primary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              +
              {formatCurrency(
                Number(income.amount),
                income.currency as CurrencyCode
              )}
            </Text>
            <Text style={[styles.date, { color: c.mutedForeground }]}>
              {formatDate(new Date(income.occurred_at), 'PPP')}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <DetailRow label={t('detail.source')}>
              {income.category ? (
                <View style={styles.sourceValue}>
                  <CategoryIcon
                    name={income.category.icon}
                    size={16}
                    color={income.category.color ?? c.foreground}
                  />
                  <Text style={[styles.value, { color: c.foreground }]}>
                    {income.category.name}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.value, { color: c.mutedForeground }]}>
                  {t('form.uncategorized')}
                </Text>
              )}
            </DetailRow>
            <DetailRow label={t('detail.note')} topBorder>
              <Text
                style={[
                  styles.value,
                  { color: income.note ? c.foreground : c.mutedForeground },
                ]}
              >
                {income.note?.trim() ? income.note.trim() : t('detail.noNote')}
              </Text>
            </DetailRow>
          </View>

          <View style={styles.actions}>
            <Button
              variant='outline'
              label={t('actions.edit')}
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

      <Modal
        visible={editOpen}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={[styles.sheet, { backgroundColor: c.background }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: c.foreground }]}>
              {t('detail.editTitle')}
            </Text>
            <Pressable
              hitSlop={8}
              accessibilityRole='button'
              accessibilityLabel={t('common:actions.close')}
              onPress={() => setEditOpen(false)}
            >
              <X size={22} color={c.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={[
              styles.sheetBody,
              { paddingBottom: insets.bottom + Spacing.five },
            ]}
          >
            {income ? (
              <IncomeForm
                mode='edit'
                defaultValues={{
                  id: income.id,
                  amount: Number(income.amount),
                  source_id: income.source_id ?? '',
                  occurred_at: new Date(income.occurred_at),
                  note: income.note ?? '',
                }}
                onSuccess={() => {
                  setEditOpen(false);
                  load();
                }}
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
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
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  loader: { marginVertical: Spacing.five },
  amountBlock: { alignItems: 'center', gap: Spacing.one },
  amount: { fontFamily: Fonts.bold, fontSize: 34 },
  date: { fontFamily: Fonts.regular, fontSize: 15 },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  label: { fontFamily: Fonts.medium, fontSize: 14 },
  detailValue: { flexShrink: 1, alignItems: 'flex-end' },
  sourceValue: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  value: { fontFamily: Fonts.medium, fontSize: 15, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: Spacing.three },
  actionButton: { flex: 1 },
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  sheetTitle: { fontFamily: Fonts.bold, fontSize: 20 },
  sheetBody: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
});
