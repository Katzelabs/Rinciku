import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';

import { type CurrencyCode } from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { Notice, ScreenScroll, Sheet } from '@/components/ui';
import { ReceiptImage } from '@/components/receipt-field';
import { TransactionDetailView } from '@/components/transaction-detail-view';
import {
  deleteExpense,
  getAttachmentSignedUrl,
  getExpense,
} from '@/features/expenses/api';
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
        <TransactionDetailView
          tone='expense'
          amount={Number(expense.amount)}
          currency={expense.currency as CurrencyCode}
          date={new Date(expense.occurred_at)}
          category={expense.category ?? null}
          note={expense.note ?? null}
          receipt={
            expense.attachment ? (
              <ReceiptImage
                storagePath={expense.attachment.storage_path}
                mimeType={expense.attachment.mime_type}
                getSignedUrl={getAttachmentSignedUrl}
              />
            ) : null
          }
          labels={{
            category: t('detail.category'),
            categoryFallback: t('common:categoryTag.uncategorized'),
            note: t('detail.note'),
            noteEmpty: t('detail.noNote'),
            receipt: t('detail.receipt'),
            edit: t('detail.edit'),
            delete: t('common:actions.delete'),
          }}
          onEdit={() => setEditOpen(true)}
          onDelete={confirmDelete}
        />
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
            existingAttachment={
              expense.attachment
                ? {
                    id: expense.attachment.id,
                    storage_path: expense.attachment.storage_path,
                    mime_type: expense.attachment.mime_type,
                  }
                : null
            }
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

const styles = StyleSheet.create({
  loader: { marginVertical: Spacing.five },
});
