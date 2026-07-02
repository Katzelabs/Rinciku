import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';

import { formatCurrency } from '@rinciku/core';

import { CategorySelect } from '@/components/category-select';
import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { DateField } from '@/components/date-field';
import { Notice } from '@/features/auth/components/notice';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { listCategories } from '@/features/categories/api';
import { confirmExpenseProposal } from '../api';
import { makeExpenseConfirmSchema, type ExpenseConfirmInput } from '../schemas';
import type { PendingAttachment, ProposedTransaction } from '../types';
import { matchCategoryId, toIsoDate } from './proposal-utils';
import { ProposalCardShell } from './proposal-card-shell';

type Props = {
  proposal: ProposedTransaction;
  attachment: PendingAttachment | null;
  onConfirmed: (note: string) => void;
  onCancel: () => void;
};

// Editable confirm card for a propose_expense. Amount stays in the currency the
// AI extracted (no picker on native yet — a follow-up); category/date/note are
// editable. Confirming writes the expense via the shared confirm handler.
export function ExpenseProposalCard({
  proposal,
  attachment,
  onConfirmed,
  onCancel,
}: Props) {
  const { t } = useTranslation('aiChat');
  const { user } = useAuth();
  const schema = useMemo(() => makeExpenseConfirmSchema(t), [t]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<ExpenseConfirmInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: proposal.amount,
      currency: proposal.currency,
      category_id: '',
      occurred_at: new Date(`${proposal.occurred_at}T00:00:00`),
      note: proposal.note ?? '',
    },
  });

  // Prefill the category from the AI's free-text hint once the taxonomy loads.
  useEffect(() => {
    let cancelled = false;
    listCategories().then(({ data }) => {
      if (cancelled) return;
      const match = matchCategoryId(proposal.category_hint, data ?? undefined);
      if (match) setValue('category_id', match);
    });
    return () => {
      cancelled = true;
    };
  }, [proposal.category_hint, setValue]);

  const submit = handleSubmit(async (values) => {
    if (!user) {
      setSubmitError(t('toast.signInRequired'));
      return;
    }
    setSubmitError(null);
    const note = values.note?.trim() ? values.note.trim() : null;
    const { error } = await confirmExpenseProposal({
      userId: user.id,
      amount: values.amount,
      currency: values.currency,
      categoryId: values.category_id,
      occurredAt: toIsoDate(values.occurred_at),
      note,
      source: attachment ? 'image' : 'chat',
      attachment: attachment
        ? {
            id: attachment.id,
            raw: proposal.raw,
            confidence: proposal.confidence,
            docType: proposal.doc_type,
          }
        : null,
    });
    if (error) {
      setSubmitError(t('toast.expenseSaveError'));
      return;
    }
    const amount = formatCurrency(values.amount, values.currency);
    onConfirmed(
      note
        ? t('proposal.loggedExpenseNote', { amount, note })
        : t('proposal.loggedExpense', { amount })
    );
  });

  return (
    <ProposalCardShell
      title={t('proposal.reviewExpense')}
      confirmLabel={t('proposal.confirmExpense')}
      onCancel={onCancel}
      onConfirm={submit}
      busy={isSubmitting}
    >
      <Controller
        control={control}
        name='amount'
        render={({ field, fieldState }) => (
          <View>
            <FieldLabel>{t('proposal.amount')}</FieldLabel>
            <CurrencyAmountInput
              currency={proposal.currency}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={!!fieldState.error}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />

      <Controller
        control={control}
        name='category_id'
        render={({ field, fieldState }) => (
          <View>
            <FieldLabel>{t('proposal.category')}</FieldLabel>
            <CategorySelect
              value={field.value || null}
              onChange={field.onChange}
              invalid={!!fieldState.error}
              placeholder={t('proposal.pickCategory')}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />

      <Controller
        control={control}
        name='occurred_at'
        render={({ field, fieldState }) => (
          <View>
            <FieldLabel>{t('proposal.date')}</FieldLabel>
            <DateField
              value={field.value}
              onChange={field.onChange}
              invalid={!!fieldState.error}
              maximumDate={new Date()}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />

      <TextField
        control={control}
        name='note'
        label={t('proposal.note')}
        placeholder={t('proposal.expenseNotePlaceholder')}
        multiline
      />

      {submitError ? <Notice tone='error'>{submitError}</Notice> : null}
    </ProposalCardShell>
  );
}
