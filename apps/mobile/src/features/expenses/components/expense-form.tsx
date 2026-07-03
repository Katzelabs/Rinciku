import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { type CurrencyCode } from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { CategorySelect } from '@/components/category-select';
import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { DateField } from '@/components/date-field';
import { ReceiptField, type ExistingAttachment } from '@/components/receipt-field';
import { Button } from '@/features/auth/components/button';
import { Notice } from '@/features/auth/components/notice';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  createAttachment,
  createExpense,
  deleteAttachment,
  deleteAttachmentObject,
  updateAttachment,
  updateExpense,
} from '@/features/expenses/api';
import {
  makeExpenseSchema,
  type ExpenseInput,
} from '@/features/expenses/schemas';
import {
  EXPENSE_BUCKET,
  uploadAttachmentObject,
  type PickedImage,
} from '@/lib/attachments';

// The existing attachment row passed in on edit — enough to preview, relink, and
// clean up the storage object when it's replaced or removed.
type ExistingReceipt = ExistingAttachment & { id: string };

type Props = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ExpenseInput> & { id?: string };
  existingAttachment?: ExistingReceipt | null;
  onSuccess: () => void;
};

// Create/edit form for an expense. Currency is locked to the user's base
// currency. A receipt image can be attached (camera or library); the object is
// only uploaded on save, then linked via the two-step confirm flow that mirrors
// the web form.
export function ExpenseForm({
  mode,
  defaultValues,
  existingAttachment,
  onSuccess,
}: Props) {
  const { t } = useTranslation('expenses');
  const { user, profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const schema = useMemo(() => makeExpenseSchema(t), [t]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PickedImage | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: defaultValues?.amount ?? undefined,
      currency: (defaultValues?.currency ?? base) as CurrencyCode,
      category_id: defaultValues?.category_id ?? '',
      occurred_at: defaultValues?.occurred_at ?? new Date(),
      note: defaultValues?.note ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    if (!user) {
      setSubmitError(t('toast.signInRequired'));
      return;
    }
    const note = values.note?.trim() ? values.note.trim() : null;
    const basePayload = {
      user_id: user.id,
      amount: values.amount,
      currency: values.currency,
      category_id: values.category_id,
      occurred_at: values.occurred_at.toISOString(),
      note,
      source: 'manual' as const,
    };

    try {
      if (mode === 'edit') {
        const id = defaultValues?.id;
        if (!id) throw new Error('missing id');

        const { error } = await updateExpense(id, {
          amount: basePayload.amount,
          currency: basePayload.currency,
          category_id: basePayload.category_id,
          occurred_at: basePayload.occurred_at,
          note,
        });
        if (error) throw error;

        // A newly picked receipt replaces whatever was there; "remove" with no
        // new pick just unlinks and deletes the existing one.
        if (receipt) {
          await uploadAndLinkExpense(id, receipt, user.id);
          if (existingAttachment) {
            await deleteAttachment(existingAttachment.id);
            await deleteAttachmentObject(existingAttachment.storage_path);
          }
        } else if (removeExisting && existingAttachment) {
          const relink = await updateExpense(id, { attachment_id: null });
          if (relink.error) throw relink.error;
          await deleteAttachment(existingAttachment.id);
          await deleteAttachmentObject(existingAttachment.storage_path);
        }

        onSuccess();
        return;
      }

      if (!receipt) {
        const { error } = await createExpense(basePayload);
        if (error) throw error;
        onSuccess();
        return;
      }

      const up = await uploadAttachmentObject(EXPENSE_BUCKET, receipt, user.id);
      if (up.error || !up.data) throw up.error ?? new Error('Upload failed');
      const storage_path = up.data.storage_path;

      const insert = await createAttachment({
        user_id: user.id,
        storage_path,
        mime_type: receipt.mimeType,
        file_size_bytes: receipt.fileSize,
      });
      if (insert.error || !insert.data) {
        await deleteAttachmentObject(storage_path);
        throw insert.error ?? new Error('Attachment insert failed');
      }
      const attachmentId = insert.data.id;

      const created = await createExpense({
        ...basePayload,
        attachment_id: attachmentId,
      });
      if (created.error || !created.data) {
        await deleteAttachment(attachmentId);
        await deleteAttachmentObject(storage_path);
        throw created.error ?? new Error('Expense insert failed');
      }

      await updateAttachment(attachmentId, {
        expense_id: created.data.id,
        confirmed: true,
      });

      onSuccess();
    } catch {
      setSubmitError(t('toast.saveError'));
    }
  });

  // Upload + insert + relink the given expense to a fresh attachment, rolling
  // back the storage object / row if any step fails.
  async function uploadAndLinkExpense(
    expenseId: string,
    asset: PickedImage,
    userId: string
  ): Promise<void> {
    const up = await uploadAttachmentObject(EXPENSE_BUCKET, asset, userId);
    if (up.error || !up.data) throw up.error ?? new Error('Upload failed');
    const storage_path = up.data.storage_path;

    const insert = await createAttachment({
      user_id: userId,
      storage_path,
      mime_type: asset.mimeType,
      file_size_bytes: asset.fileSize,
    });
    if (insert.error || !insert.data) {
      await deleteAttachmentObject(storage_path);
      throw insert.error ?? new Error('Attachment insert failed');
    }
    const newId = insert.data.id;

    const relink = await updateExpense(expenseId, { attachment_id: newId });
    if (relink.error) {
      await deleteAttachment(newId);
      await deleteAttachmentObject(storage_path);
      throw relink.error;
    }
    await updateAttachment(newId, { expense_id: expenseId, confirmed: true });
  }

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name='amount'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('form.amount')}</FieldLabel>
            <CurrencyAmountInput
              currency={base}
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
          <View style={styles.field}>
            <FieldLabel>{t('form.category')}</FieldLabel>
            <CategorySelect
              value={field.value || null}
              onChange={field.onChange}
              invalid={!!fieldState.error}
              placeholder={t('form.categoryPlaceholder')}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />

      <Controller
        control={control}
        name='occurred_at'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('form.date')}</FieldLabel>
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
        label={t('form.note')}
        placeholder={t('form.notePlaceholder')}
        multiline
      />

      <ReceiptField
        label={t('form.receipt')}
        value={receipt}
        onChange={setReceipt}
        existing={mode === 'edit' ? (existingAttachment ?? null) : null}
        removed={removeExisting}
        onRemovedChange={setRemoveExisting}
        disabled={isSubmitting}
      />

      {submitError ? <Notice tone='error'>{submitError}</Notice> : null}

      <Button
        label={
          mode === 'create' ? t('form.submitCreate') : t('form.submitEdit')
        }
        loading={isSubmitting}
        onPress={onSubmit}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  field: { gap: Spacing.two },
  submit: { marginTop: Spacing.two },
});
