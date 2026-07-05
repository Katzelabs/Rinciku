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
  deleteIncome,
  getIncome,
  getIncomeAttachmentSignedUrl,
} from '@/features/incomes/api';
import { IncomeForm } from '@/features/incomes/components/income-form';
import type { IncomeWithRelations } from '@/features/incomes/types';
import { useTheme } from '@/hooks/use-theme';

export default function IncomeDetailScreen() {
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const router = useRouter();
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
    <ScreenScroll gap={Spacing.four}>
      {loading ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : error || !income ? (
        <Notice tone='error'>
          {error ?? t('page.loadError', { error: '' })}
        </Notice>
      ) : (
        <TransactionDetailView
          tone='income'
          amount={Number(income.amount)}
          currency={income.currency as CurrencyCode}
          date={new Date(income.occurred_at)}
          category={income.category ?? null}
          note={income.note ?? null}
          receipt={
            income.attachment ? (
              <ReceiptImage
                storagePath={income.attachment.storage_path}
                mimeType={income.attachment.mime_type}
                getSignedUrl={getIncomeAttachmentSignedUrl}
              />
            ) : null
          }
          labels={{
            category: t('detail.source'),
            categoryFallback: t('form.uncategorized'),
            note: t('detail.note'),
            noteEmpty: t('detail.noNote'),
            receipt: t('detail.proof'),
            edit: t('actions.edit'),
            delete: t('common:actions.delete'),
          }}
          onEdit={() => setEditOpen(true)}
          onDelete={confirmDelete}
        />
      )}

      <Sheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('detail.editTitle')}
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
            existingAttachment={
              income.attachment
                ? {
                    id: income.attachment.id,
                    storage_path: income.attachment.storage_path,
                    mime_type: income.attachment.mime_type,
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
