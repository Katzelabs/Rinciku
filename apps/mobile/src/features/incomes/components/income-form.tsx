import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { type CurrencyCode } from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { AmountHeroField } from '@/components/amount-hero-field';
import { DateField } from '@/components/date-field';
import {
  ReceiptField,
  type ExistingAttachment,
} from '@/components/receipt-field';
import { Button } from '@/features/auth/components/button';
import { Notice } from '@/features/auth/components/notice';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  createIncome,
  createIncomeAttachment,
  deleteIncomeAttachment,
  deleteIncomeAttachmentObject,
  updateIncome,
  updateIncomeAttachment,
} from '@/features/incomes/api';
import { IncomeSourceSelect } from '@/features/incomes/components/income-source-select';
import { makeIncomeSchema, type IncomeInput } from '@/features/incomes/schemas';
import {
  INCOME_BUCKET,
  uploadAttachmentObject,
  type PickedImage,
} from '@/lib/attachments';

type ExistingReceipt = ExistingAttachment & { id: string };

type Props = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<IncomeInput> & { id?: string };
  existingAttachment?: ExistingReceipt | null;
  onSuccess: () => void;
};

// Create/edit form for an income. Currency is locked to the user's base
// currency; the source (income category) is optional. A proof-of-income image
// can be attached (camera or library), uploaded only on save and linked via the
// two-step confirm flow, mirroring the web form. Save errors surface inline.
export function IncomeForm({
  mode,
  defaultValues,
  existingAttachment,
  onSuccess,
}: Props) {
  const { t } = useTranslation('incomes');
  const { user, profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const schema = useMemo(() => makeIncomeSchema(t), [t]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PickedImage | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IncomeInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: defaultValues?.amount ?? undefined,
      source_id: defaultValues?.source_id ?? '',
      occurred_at: defaultValues?.occurred_at ?? new Date(),
      note: defaultValues?.note ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    if (!user) {
      setSubmitError(t('toast.needSignIn'));
      return;
    }
    const note = values.note?.trim() ? values.note.trim() : null;
    const source_id = values.source_id ? values.source_id : null;
    const basePayload = {
      user_id: user.id,
      source_id,
      amount: values.amount,
      currency: base,
      occurred_at: values.occurred_at.toISOString(),
      note,
      source: 'manual' as const,
    };

    try {
      if (mode === 'edit') {
        const id = defaultValues?.id;
        if (!id) throw new Error('missing id');

        const { error } = await updateIncome(id, {
          source_id,
          amount: basePayload.amount,
          currency: base,
          occurred_at: basePayload.occurred_at,
          note,
        });
        if (error) throw error;

        if (receipt) {
          await uploadAndLinkIncome(id, receipt, user.id);
          if (existingAttachment) {
            await deleteIncomeAttachment(existingAttachment.id);
            await deleteIncomeAttachmentObject(existingAttachment.storage_path);
          }
        } else if (removeExisting && existingAttachment) {
          const relink = await updateIncome(id, { attachment_id: null });
          if (relink.error) throw relink.error;
          await deleteIncomeAttachment(existingAttachment.id);
          await deleteIncomeAttachmentObject(existingAttachment.storage_path);
        }

        onSuccess();
        return;
      }

      if (!receipt) {
        const { error } = await createIncome(basePayload);
        if (error) throw error;
        onSuccess();
        return;
      }

      const up = await uploadAttachmentObject(INCOME_BUCKET, receipt, user.id);
      if (up.error || !up.data) throw up.error ?? new Error('Upload failed');
      const storage_path = up.data.storage_path;

      const insert = await createIncomeAttachment({
        user_id: user.id,
        storage_path,
        mime_type: receipt.mimeType,
        file_size_bytes: receipt.fileSize,
      });
      if (insert.error || !insert.data) {
        await deleteIncomeAttachmentObject(storage_path);
        throw insert.error ?? new Error('Attachment insert failed');
      }
      const attachmentId = insert.data.id;

      const created = await createIncome({
        ...basePayload,
        attachment_id: attachmentId,
      });
      if (created.error || !created.data) {
        await deleteIncomeAttachment(attachmentId);
        await deleteIncomeAttachmentObject(storage_path);
        throw created.error ?? new Error('Income insert failed');
      }

      await updateIncomeAttachment(attachmentId, {
        income_id: created.data.id,
        confirmed: true,
      });

      onSuccess();
    } catch {
      setSubmitError(t('toast.saveError'));
    }
  });

  // Upload + insert + relink the given income to a fresh attachment, rolling
  // back the storage object / row if any step fails.
  async function uploadAndLinkIncome(
    incomeId: string,
    asset: PickedImage,
    userId: string
  ): Promise<void> {
    const up = await uploadAttachmentObject(INCOME_BUCKET, asset, userId);
    if (up.error || !up.data) throw up.error ?? new Error('Upload failed');
    const storage_path = up.data.storage_path;

    const insert = await createIncomeAttachment({
      user_id: userId,
      storage_path,
      mime_type: asset.mimeType,
      file_size_bytes: asset.fileSize,
    });
    if (insert.error || !insert.data) {
      await deleteIncomeAttachmentObject(storage_path);
      throw insert.error ?? new Error('Attachment insert failed');
    }
    const newId = insert.data.id;

    const relink = await updateIncome(incomeId, { attachment_id: newId });
    if (relink.error) {
      await deleteIncomeAttachment(newId);
      await deleteIncomeAttachmentObject(storage_path);
      throw relink.error;
    }
    await updateIncomeAttachment(newId, {
      income_id: incomeId,
      confirmed: true,
    });
  }

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name='amount'
        render={({ field, fieldState }) => (
          <AmountHeroField
            tone='income'
            label={t('form.amount')}
            currency={base}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name='source_id'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('form.source')}</FieldLabel>
            <IncomeSourceSelect
              value={field.value || null}
              onChange={field.onChange}
              invalid={!!fieldState.error}
              placeholder={t('form.pickSource')}
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
        label={t('form.proof')}
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
