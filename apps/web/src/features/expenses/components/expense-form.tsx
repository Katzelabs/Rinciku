import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDate } from '@rinciku/core';
import { defineAttachmentConfig } from '@rinciku/core';
import type { CurrencyCode } from '@rinciku/core';
import type { ScanExtractionMeta } from '@rinciku/domain/ai-chat';
import { CurrencyAmountInput } from '@/components/shared/currency-amount-input';
import { useAuth } from '@/features/auth';
import {
  groupByTier,
  useCategories,
  useTiers,
} from '@/features/categories/hooks/use-categories';

import { AttachmentField } from '@/components/shared/attachment-field';
import {
  createAttachment,
  createExpense,
  deleteAttachment,
  deleteAttachmentObject,
  getAttachmentSignedUrl,
  updateAttachment,
  updateExpense,
  uploadAttachment,
} from '../api';
import { makeExpenseSchema, type ExpenseInput } from '../schemas';

// Single source of truth for accepted types + size limit (kept in sync with the
// expense-attachments bucket in supabase/seed.sql).
const EXPENSE_ATTACHMENT = defineAttachmentConfig([
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

type ExpenseFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ExpenseInput> & { id?: string };
  existingAttachment?: ExistingAttachment | null;
  // Scan-to-prefill: a file staged before the form opened, plus the AI
  // extraction it came from. While the user keeps this exact file, the save
  // is recorded as source 'image' and the extraction metadata lands on the
  // attachment row; replacing/removing it falls back to a plain manual entry.
  initialAttachment?: File | null;
  extraction?: ScanExtractionMeta | null;
  onSuccess: () => void;
};

export function ExpenseForm({
  mode,
  defaultValues,
  existingAttachment,
  initialAttachment,
  extraction,
  onSuccess,
}: ExpenseFormProps) {
  const { t } = useTranslation('expenses');
  const { user, profile } = useAuth();
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const { data: tiers } = useTiers();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(
    initialAttachment ?? null
  );
  const [removeExisting, setRemoveExisting] = useState(false);

  const grouped = useMemo(
    () => (categories ? groupByTier(categories, tiers ?? []) : null),
    [categories, tiers]
  );

  // On create, currency is locked to the user's current base. On edit, preserve
  // the row's stored currency so historical rows are not silently rewritten.
  const baseCurrency = (profile?.base_currency ?? 'IDR') as CurrencyCode;
  const lockedCurrency: CurrencyCode = defaultValues?.currency ?? baseCurrency;

  const schema = useMemo(() => makeExpenseSchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      currency: lockedCurrency,
      category_id: defaultValues?.category_id ?? '',
      occurred_at: defaultValues?.occurred_at ?? new Date(),
      note: defaultValues?.note ?? '',
    },
  });

  const currency = useWatch({ control, name: 'currency' });

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error(t('toast.signInRequired'));
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      toast.error(t('toast.missingEditId'));
      return;
    }
    try {
      const trimmedNote = values.note?.trim();
      // Only an unchanged scanned file counts as an image-sourced entry.
      const scanned =
        !!extraction && !!attachment && attachment === initialAttachment;
      const basePayload = {
        user_id: user.id,
        amount: values.amount,
        currency: values.currency,
        category_id: values.category_id,
        occurred_at: toIsoDate(values.occurred_at),
        note: trimmedNote ? trimmedNote : null,
        source: scanned ? ('image' as const) : ('manual' as const),
      };

      if (mode === 'edit') {
        const id = defaultValues!.id!;
        const { error } = await updateExpense(id, basePayload);
        if (error) throw error;

        // Attachment changes are independent of the metadata update above:
        // a staged file replaces whatever was there; "remove" with no new file
        // unlinks and deletes the existing one.
        if (attachment) {
          const upload = await uploadAttachment(attachment, {
            userId: user.id,
            occurredAt: values.occurred_at,
          });
          if (upload.error || !upload.data)
            throw upload.error ?? new Error('Upload failed');
          const storage_path = upload.data.storage_path;

          const insert = await createAttachment({
            user_id: user.id,
            storage_path,
            mime_type: attachment.type,
            file_size_bytes: attachment.size,
          });
          if (insert.error || !insert.data) {
            await deleteAttachmentObject(storage_path);
            throw insert.error ?? new Error('Attachment insert failed');
          }
          const newId = insert.data.id;

          const relink = await updateExpense(id, { attachment_id: newId });
          if (relink.error) {
            await deleteAttachment(newId);
            await deleteAttachmentObject(storage_path);
            throw relink.error;
          }
          await updateAttachment(newId, { expense_id: id, confirmed: true });

          // The previous attachment is now orphaned — drop row + object.
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

        toast.success(t('toast.updated'));
        onSuccess();
        return;
      }

      if (!attachment) {
        const { error } = await createExpense(basePayload);
        if (error) throw error;
        toast.success(t('toast.added'));
        onSuccess();
        return;
      }

      const upload = await uploadAttachment(attachment, {
        userId: user.id,
        occurredAt: values.occurred_at,
      });
      if (upload.error || !upload.data)
        throw upload.error ?? new Error('Upload failed');
      const storage_path = upload.data.storage_path;

      const attachmentInsert = await createAttachment({
        user_id: user.id,
        storage_path,
        mime_type: attachment.type,
        file_size_bytes: attachment.size,
      });
      if (attachmentInsert.error || !attachmentInsert.data) {
        await deleteAttachmentObject(storage_path);
        throw attachmentInsert.error ?? new Error('Attachment insert failed');
      }
      const attachmentId = attachmentInsert.data.id;

      const expenseInsert = await createExpense({
        ...basePayload,
        attachment_id: attachmentId,
      });
      if (expenseInsert.error || !expenseInsert.data) {
        await deleteAttachment(attachmentId);
        await deleteAttachmentObject(storage_path);
        throw expenseInsert.error ?? new Error('Expense insert failed');
      }

      const confirm = await updateAttachment(attachmentId, {
        expense_id: expenseInsert.data.id,
        confirmed: true,
        ...(scanned && extraction
          ? {
              ai_raw_extraction: extraction.raw,
              ai_confidence: extraction.confidence,
              doc_type: extraction.docType,
            }
          : {}),
      });
      if (confirm.error) {
        console.warn('Attachment confirm step failed', confirm.error);
      }

      toast.success(t('toast.added'));
      onSuccess();
    } catch (err) {
      console.error('Failed to save expense', err);
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
              <FieldLabel htmlFor='expense-amount'>
                {t('form.amount')}
              </FieldLabel>
              <CurrencyAmountInput
                id='expense-amount'
                currency={currency}
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
          name='category_id'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='expense-category'>
                {t('form.category')}
              </FieldLabel>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={categoriesLoading || !!categoriesError}
              >
                <SelectTrigger
                  id='expense-category'
                  className='w-full'
                  aria-invalid={fieldState.invalid || undefined}
                >
                  <SelectValue
                    placeholder={
                      categoriesLoading
                        ? t('form.categoryLoading')
                        : categoriesError
                          ? t('form.categoryError')
                          : t('form.categoryPlaceholder')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {grouped?.map((group) => {
                    if (group.categories.length === 0) return null;
                    const key = group.tier?.id ?? '__untiered__';
                    return (
                      <SelectGroup key={key}>
                        <SelectLabel>
                          {group.tier?.name ?? t('form.untiered')}
                        </SelectLabel>
                        {group.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
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
              <FieldLabel htmlFor='expense-date'>{t('form.date')}</FieldLabel>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id='expense-date'
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
                      : t('form.datePlaceholder')}
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

        <Field data-invalid={errors.note ? true : undefined}>
          <FieldLabel htmlFor='expense-note'>{t('form.note')}</FieldLabel>
          <Textarea
            id='expense-note'
            rows={3}
            placeholder={t('form.notePlaceholder')}
            aria-invalid={errors.note ? true : undefined}
            {...register('note')}
          />
          <FieldError errors={errors.note ? [errors.note] : undefined} />
        </Field>

        <Field>
          <FieldLabel>{t('form.receipt')}</FieldLabel>
          <AttachmentField
            file={attachment}
            onFileChange={setAttachment}
            existing={mode === 'edit' ? (existingAttachment ?? null) : null}
            removed={removeExisting}
            onRemovedChange={setRemoveExisting}
            getSignedUrl={getAttachmentSignedUrl}
            disabled={isSubmitting}
            accept={EXPENSE_ATTACHMENT.accept}
            allowedMime={EXPENSE_ATTACHMENT.allowedMime}
            maxBytes={EXPENSE_ATTACHMENT.maxBytes}
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
