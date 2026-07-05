import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatCurrency, formatDate, type CurrencyCode } from '@rinciku/core';

import { CategoryBadge } from '@/components/category-badge';
import { AppText, Button, Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

export type DetailCategory = {
  id?: string;
  name: string;
  icon?: string | null;
  color?: string | null;
};

export type DetailLabels = {
  /** "Category" (expense) / "Source" (income). */
  category: string;
  /** Shown when there's no category/source. */
  categoryFallback: string;
  note: string;
  /** Shown when the note is empty. */
  noteEmpty: string;
  /** "Receipt" (expense) / "Proof" (income). */
  receipt: string;
  edit: string;
  delete: string;
};

// Shared read view for a single expense / income. A tone-washed hero (emoji
// category chip → amount → rich date) mirrors the list summary headers: income
// is green (`positive`), expense a warm-neutral, and the amount is never a lime
// text fill. The note is a full-width block so long notes wrap naturally instead
// of getting crushed into a right-aligned row.
export function TransactionDetailView({
  tone,
  amount,
  currency,
  date,
  category,
  note,
  receipt,
  labels,
  onEdit,
  onDelete,
}: {
  tone: 'expense' | 'income';
  amount: number;
  currency: CurrencyCode;
  date: Date;
  category: DetailCategory | null;
  note: string | null;
  receipt: ReactNode | null;
  labels: DetailLabels;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const c = useTheme();
  const accent = tone === 'income' ? c.positive : c.mutedForeground;
  const heroColor = tone === 'income' ? c.positive : c.foreground;

  const trimmedNote = note?.trim() ?? '';
  const hasNote = trimmedNote.length > 0;

  return (
    <>
      <Card
        style={[
          styles.hero,
          {
            backgroundColor: withAlpha(accent, '14'),
            borderColor: withAlpha(accent, '33'),
          },
        ]}
      >
        <CategoryBadge
          icon={category?.icon}
          color={category?.color}
          seed={category?.id ?? category?.name}
          size={56}
        />
        <AppText
          variant='hero'
          style={[styles.amount, { color: heroColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatCurrency(amount, currency)}
        </AppText>
        <AppText variant='caption' color='mutedForeground'>
          {formatDate(date, 'EEEE, PPP')}
        </AppText>
      </Card>

      <Card padding={0} style={styles.card}>
        <View style={styles.row}>
          <AppText variant='label' color='mutedForeground'>
            {labels.category}
          </AppText>
          <AppText
            variant='amount'
            numberOfLines={1}
            color={category ? 'foreground' : 'mutedForeground'}
            style={styles.rowValue}
          >
            {category?.name ?? labels.categoryFallback}
          </AppText>
        </View>
        <View style={[styles.noteBlock, { borderTopColor: c.border }]}>
          <AppText variant='label' color='mutedForeground'>
            {labels.note}
          </AppText>
          <AppText variant='body' color={hasNote ? 'foreground' : 'mutedForeground'}>
            {hasNote ? trimmedNote : labels.noteEmpty}
          </AppText>
        </View>
      </Card>

      {receipt ? (
        <View style={styles.receiptBlock}>
          <AppText variant='label' color='mutedForeground'>
            {labels.receipt}
          </AppText>
          {receipt}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          variant='outline'
          label={labels.edit}
          onPress={onEdit}
          style={styles.actionButton}
        />
        <Button
          variant='destructive'
          label={labels.delete}
          onPress={onDelete}
          style={styles.actionButton}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.two },
  amount: { marginTop: Spacing.one },
  card: { paddingHorizontal: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  noteBlock: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  receiptBlock: { gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.three },
  actionButton: { flex: 1 },
});
