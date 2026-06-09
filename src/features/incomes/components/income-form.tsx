// AI-driven income logging (chat / image source) plugs in later via the
// ai-chat feature. This form covers only manual entry. The submit flow with an
// attachment mirrors expense-form: upload → createIncomeAttachment →
// createIncome (linking attachment_id) → updateIncomeAttachment (set
// income_id + confirmed = true).

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

import { AttachmentDropzone } from '@/components/shared/attachment-dropzone';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { CurrencyCode } from '@/lib/fx';
import { useAuth } from '@/features/auth';

import {
  createIncome,
  createIncomeAttachment,
  deleteIncomeAttachment,
  deleteIncomeAttachmentObject,
  updateIncome,
  updateIncomeAttachment,
  uploadIncomeAttachment,
} from '../api';
import { incomeSchema, type IncomeInput } from '../schemas';

const INCOME_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

// Currencies that conventionally have no fractional unit. Drives the
// `step` attribute on the amount input so the spinner advances by 1.
const ZERO_DECIMAL_CURRENCIES = new Set<CurrencyCode>(['JPY', 'KRW', 'VND']);

type IncomeFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<IncomeInput> & { id?: string };
  onSuccess: () => void;
};

export function IncomeForm({
  mode,
  defaultValues,
  onSuccess,
}: IncomeFormProps) {
  const { user, profile } = useAuth();
  const baseCurrency = (profile?.base_currency ?? 'IDR') as CurrencyCode;
  const amountStep = ZERO_DECIMAL_CURRENCIES.has(baseCurrency) ? '1' : '0.01';

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      occurred_at: defaultValues?.occurred_at ?? new Date(),
      note: defaultValues?.note ?? '',
    },
  });

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error('You need to be signed in to log an income.');
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      toast.error('Missing income id for edit.');
      return;
    }
    try {
      const trimmedNote = values.note?.trim();
      const basePayload = {
        user_id: user.id,
        amount: values.amount,
        currency: baseCurrency,
        occurred_at: toIsoDate(values.occurred_at),
        note: trimmedNote ? trimmedNote : null,
        source: 'manual' as const,
      };

      if (mode === 'edit') {
        // TODO: support replacing/removing attachments in edit mode.
        const { error } = await updateIncome(defaultValues!.id!, basePayload);
        if (error) throw error;
        toast.success('Income updated');
        onSuccess();
        return;
      }

      if (!attachment) {
        const { error } = await createIncome(basePayload);
        if (error) throw error;
        toast.success('Income added');
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

      toast.success('Income added');
      onSuccess();
    } catch (err) {
      console.error('Failed to save income', err);
      toast.error('Could not save income. Please try again.');
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.amount ? true : undefined}>
          <FieldLabel htmlFor='income-amount'>Amount</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <span className='text-sm font-medium text-muted-foreground'>
                {baseCurrency}
              </span>
            </InputGroupAddon>
            <InputGroupInput
              id='income-amount'
              type='number'
              inputMode='decimal'
              step={amountStep}
              min='0'
              placeholder={amountStep === '1' ? '0' : '0.00'}
              autoFocus
              aria-invalid={errors.amount ? true : undefined}
              {...register('amount', { valueAsNumber: true })}
            />
          </InputGroup>
          <FieldError errors={errors.amount ? [errors.amount] : undefined} />
        </Field>

        <Controller
          control={control}
          name='occurred_at'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='income-date'>Date</FieldLabel>
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
                      ? format(field.value, 'd MMM yyyy')
                      : 'Pick a date'}
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
          <FieldLabel htmlFor='income-note'>Note (optional)</FieldLabel>
          <Textarea
            id='income-note'
            rows={3}
            placeholder='e.g. May salary, side gig invoice #42'
            aria-invalid={errors.note ? true : undefined}
            {...register('note')}
          />
          <FieldError errors={errors.note ? [errors.note] : undefined} />
        </Field>

        {mode === 'create' && (
          <Field>
            <FieldLabel>Proof of income (optional)</FieldLabel>
            <AttachmentDropzone
              value={attachment}
              onChange={setAttachment}
              disabled={isSubmitting}
              accept='image/jpeg,image/png,image/webp,image/heic,application/pdf'
              allowedMime={INCOME_ALLOWED_MIME}
              hintLabel='Drop a transfer proof or click to browse'
              hintFormats='JPG, PNG, WEBP, HEIC, or PDF · 10 MB max'
              invalidTypeMessage='File must be an image (JPG, PNG, WEBP, HEIC) or PDF.'
              oversizedMessage='File must be 10 MB or smaller.'
            />
          </Field>
        )}

        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting
            ? mode === 'create'
              ? 'Saving…'
              : 'Updating…'
            : mode === 'create'
              ? 'Add income'
              : 'Update income'}
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
