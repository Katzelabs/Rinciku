// AI-driven income logging (chat / image source) plugs in later via the
// ai-chat feature. This form covers only manual entry. The submit flow with an
// attachment mirrors expense-form: upload → createIncomeAttachment →
// createIncome (linking attachment_id) → updateIncomeAttachment (set
// income_id + confirmed = true).

import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { AttachmentField } from '@/components/shared/attachment-field';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDate, activeDateFnsLocale } from '@rinciku/core';
import { defineAttachmentConfig } from '@rinciku/core';
import type { CurrencyCode } from '@rinciku/core';
import { CurrencyAmountInput } from '@/components/shared/currency-amount-input';
import { useAuth } from '@/features/auth';

import {
  createIncome,
  createIncomeAttachment,
  deleteIncomeAttachment,
  deleteIncomeAttachmentObject,
  getIncomeAttachmentSignedUrl,
  updateIncome,
  updateIncomeAttachment,
  uploadIncomeAttachment,
} from '../api';
import { useIncomeCategories } from '../hooks/use-income-categories';
import { makeIncomeSchema, type IncomeInput } from '../schemas';

// Radix Select cannot hold an empty-string value, so "no source" is represented
// by this sentinel in the Select and mapped back to '' / null around it.
const NO_SOURCE = '__none__';

// Single source of truth for accepted types + size limit (kept in sync with the
// income-attachments bucket in supabase/seed.sql).
const INCOME_ATTACHMENT = defineAttachmentConfig([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

type ExistingAttachment = {
  id: string;
  storage_path: string;
  mime_type: string | null;
};

type IncomeFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<IncomeInput> & { id?: string };
  existingAttachment?: ExistingAttachment | null;
  onSuccess: () => void;
};

export function IncomeForm({
  mode,
  defaultValues,
  existingAttachment,
  onSuccess,
}: IncomeFormProps) {
  const { t } = useTranslation('incomes');
  const { user, profile } = useAuth();
  const baseCurrency = (profile?.base_currency ?? 'IDR') as CurrencyCode;
  const incomeSchema = useMemo(() => makeIncomeSchema(t), [t]);

  const {
    data: incomeCategories,
    isLoading: incomeCategoriesLoading,
    error: incomeCategoriesError,
  } = useIncomeCategories();

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      source_id: defaultValues?.source_id ?? '',
      occurred_at: defaultValues?.occurred_at ?? new Date(),
      note: defaultValues?.note ?? '',
    },
  });

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error(t('toast.needSignIn'));
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      toast.error(t('toast.missingId'));
      return;
    }
    try {
      const trimmedNote = values.note?.trim();
      const basePayload = {
        user_id: user.id,
        amount: values.amount,
        currency: baseCurrency,
        source_id: values.source_id ? values.source_id : null,
        occurred_at: toIsoDate(values.occurred_at),
        note: trimmedNote ? trimmedNote : null,
        source: 'manual' as const,
      };

      if (mode === 'edit') {
        const id = defaultValues!.id!;
        const { error } = await updateIncome(id, basePayload);
        if (error) throw error;

        // Attachment changes are independent of the metadata update above:
        // a staged file replaces whatever was there; "remove" with no new file
        // unlinks and deletes the existing one.
        if (attachment) {
          const upload = await uploadIncomeAttachment(attachment, {
            userId: user.id,
            occurredAt: values.occurred_at,
          });
          if (upload.error || !upload.data)
            throw upload.error ?? new Error('Upload failed');
          const storage_path = upload.data.storage_path;

          const insert = await createIncomeAttachment({
            user_id: user.id,
            storage_path,
            mime_type: attachment.type,
            file_size_bytes: attachment.size,
          });
          if (insert.error || !insert.data) {
            await deleteIncomeAttachmentObject(storage_path);
            throw insert.error ?? new Error('Attachment insert failed');
          }
          const newId = insert.data.id;

          const relink = await updateIncome(id, { attachment_id: newId });
          if (relink.error) {
            await deleteIncomeAttachment(newId);
            await deleteIncomeAttachmentObject(storage_path);
            throw relink.error;
          }
          await updateIncomeAttachment(newId, {
            income_id: id,
            confirmed: true,
          });

          // The previous attachment is now orphaned — drop row + object.
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

        toast.success(t('toast.updated'));
        onSuccess();
        return;
      }

      if (!attachment) {
        const { error } = await createIncome(basePayload);
        if (error) throw error;
        toast.success(t('toast.added'));
        onSuccess();
        return;
      }

      const upload = await uploadIncomeAttachment(attachment, {
        userId: user.id,
        occurredAt: values.occurred_at,
      });
      if (upload.error || !upload.data)
        throw upload.error ?? new Error('Upload failed');
      const storage_path = upload.data.storage_path;

      const attachmentInsert = await createIncomeAttachment({
        user_id: user.id,
        storage_path,
        mime_type: attachment.type,
        file_size_bytes: attachment.size,
      });
      if (attachmentInsert.error || !attachmentInsert.data) {
        await deleteIncomeAttachmentObject(storage_path);
        throw attachmentInsert.error ?? new Error('Attachment insert failed');
      }
      const attachmentId = attachmentInsert.data.id;

      const incomeInsert = await createIncome({
        ...basePayload,
        attachment_id: attachmentId,
      });
      if (incomeInsert.error || !incomeInsert.data) {
        await deleteIncomeAttachment(attachmentId);
        await deleteIncomeAttachmentObject(storage_path);
        throw incomeInsert.error ?? new Error('Income insert failed');
      }

      const confirm = await updateIncomeAttachment(attachmentId, {
        income_id: incomeInsert.data.id,
        confirmed: true,
      });
      if (confirm.error) {
        console.warn('Attachment confirm step failed', confirm.error);
      }

      toast.success(t('toast.added'));
      onSuccess();
    } catch (err) {
      console.error('Failed to save income', err);
      toast.error(t('toast.saveError'));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Controller
          control={control}
          name='amount'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='income-amount'>
                {t('form.amount')}
              </FieldLabel>
              <CurrencyAmountInput
                id='income-amount'
                currency={baseCurrency}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                name={field.name}
                autoFocus
                invalid={fieldState.invalid}
              />
              <FieldError
                errors={fieldState.error ? [fieldState.error] : undefined}
              />
            </Field>
          )}
        />

        <Controller
          control={control}
          name='occurred_at'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='income-date'>{t('form.date')}</FieldLabel>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id='income-date'
                    type='button'
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                    aria-invalid={fieldState.invalid || undefined}
                  >
                    <CalendarIcon className='mr-2 size-4' />
                    {field.value
                      ? formatDate(field.value, 'd MMM yyyy')
                      : t('form.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(date);
                        setDatePickerOpen(false);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    locale={activeDateFnsLocale()}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FieldError
                errors={fieldState.error ? [fieldState.error] : undefined}
              />
            </Field>
          )}
        />

        <Controller
          control={control}
          name='source_id'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='income-source'>
                {t('form.source')}
              </FieldLabel>
              <Select
                value={field.value ? field.value : NO_SOURCE}
                onValueChange={(v) => field.onChange(v === NO_SOURCE ? '' : v)}
                disabled={incomeCategoriesLoading || !!incomeCategoriesError}
              >
                <SelectTrigger
                  id='income-source'
                  className='w-full'
                  aria-invalid={fieldState.invalid || undefined}
                >
                  <SelectValue
                    placeholder={
                      incomeCategoriesLoading
                        ? t('form.loadingSources')
                        : incomeCategoriesError
                          ? t('form.sourcesError')
                          : t('form.pickSource')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SOURCE}>
                    {t('form.uncategorized')}
                  </SelectItem>
                  {incomeCategories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                errors={fieldState.error ? [fieldState.error] : undefined}
              />
            </Field>
          )}
        />

        <Field data-invalid={errors.note ? true : undefined}>
          <FieldLabel htmlFor='income-note'>{t('form.note')}</FieldLabel>
          <Textarea
            id='income-note'
            rows={3}
            placeholder={t('form.notePlaceholder')}
            aria-invalid={errors.note ? true : undefined}
            {...register('note')}
          />
          <FieldError errors={errors.note ? [errors.note] : undefined} />
        </Field>

        <Field>
          <FieldLabel>{t('form.proof')}</FieldLabel>
          <AttachmentField
            file={attachment}
            onFileChange={setAttachment}
            existing={mode === 'edit' ? (existingAttachment ?? null) : null}
            removed={removeExisting}
            onRemovedChange={setRemoveExisting}
            getSignedUrl={getIncomeAttachmentSignedUrl}
            disabled={isSubmitting}
            accept={INCOME_ATTACHMENT.accept}
            allowedMime={INCOME_ATTACHMENT.allowedMime}
            maxBytes={INCOME_ATTACHMENT.maxBytes}
            hintLabel={t('form.attachmentHint')}
            hintFormats={t('form.attachmentFormats')}
            invalidTypeMessage={t('form.attachmentInvalidType')}
            oversizedMessage={t('form.attachmentOversized')}
          />
        </Field>

        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting
            ? mode === 'create'
              ? t('form.saving')
              : t('form.updating')
            : mode === 'create'
              ? t('form.submitCreate')
              : t('form.submitEdit')}
        </Button>
      </FieldGroup>
    </form>
  );
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
