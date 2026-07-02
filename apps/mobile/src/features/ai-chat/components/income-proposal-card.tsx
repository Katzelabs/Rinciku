import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';

import { formatCurrency } from '@rinciku/core';

import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { DateField } from '@/components/date-field';
import { Notice } from '@/features/auth/components/notice';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { listIncomeCategories } from '@/features/incomes/api';
import { confirmIncomeProposal } from '../api';
import { makeIncomeConfirmSchema, type IncomeConfirmInput } from '../schemas';
import type { PendingAttachment, ProposedTransaction } from '../types';
import { matchCategoryId, toIsoDate } from './proposal-utils';
import { ProposalCardShell } from './proposal-card-shell';
import { SourceSelect } from './source-select';

type Props = {
  proposal: ProposedTransaction;
  attachment: PendingAttachment | null;
  onConfirmed: (note: string) => void;
  onCancel: () => void;
};

// Editable confirm card for a propose_income. Source is optional (income
// categories have no tier); amount/date/note mirror the expense card.
export function IncomeProposalCard({
  proposal,
  attachment,
  onConfirmed,
  onCancel,
}: Props) {
  const { t } = useTranslation('aiChat');
  const { user } = useAuth();
  const schema = useMemo(() => makeIncomeConfirmSchema(t), [t]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<IncomeConfirmInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: proposal.amount,
      currency: proposal.currency,
      source_id: '',
      occurred_at: new Date(`${proposal.occurred_at}T00:00:00`),
      note: proposal.note ?? '',
    },
  });

  // Prefill the source from the AI hint once income categories load.
  useEffect(() => {
    let cancelled = false;
    listIncomeCategories().then(({ data }) => {
      if (cancelled) return;
      const match = matchCategoryId(proposal.category_hint, data ?? undefined);
      if (match) setValue('source_id', match);
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
    const { error } = await confirmIncomeProposal({
      userId: user.id,
      sourceId: values.source_id ? values.source_id : null,
      amount: values.amount,
      currency: values.currency,
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
      setSubmitError(t('toast.incomeSaveError'));
      return;
    }
    const amount = formatCurrency(values.amount, values.currency);
    onConfirmed(
      note
        ? t('proposal.loggedIncomeNote', { amount, note })
        : t('proposal.loggedIncome', { amount })
    );
  });

  return (
    <ProposalCardShell
      title={t('proposal.reviewIncome')}
      confirmLabel={t('proposal.confirmIncome')}
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
        name='source_id'
        render={({ field }) => (
          <View>
            <FieldLabel>{t('proposal.source')}</FieldLabel>
            <SourceSelect
              value={field.value ?? ''}
              onChange={field.onChange}
            />
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
        placeholder={t('proposal.incomeNotePlaceholder')}
        multiline
      />

      {submitError ? <Notice tone='error'>{submitError}</Notice> : null}
    </ProposalCardShell>
  );
}
