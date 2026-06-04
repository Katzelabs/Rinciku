import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
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
import { convertToIdr } from '@/lib/fx';
import { useAuth } from '@/features/auth';
import {
  groupByTier,
  useCategories,
} from '@/features/categories/hooks/use-categories';

import {
  createAttachment,
  createExpense,
  deleteAttachment,
  deleteAttachmentObject,
  updateAttachment,
  updateExpense,
  uploadAttachment,
} from '../api';
import { expenseSchema, type ExpenseInput } from '../schemas';
import { AttachmentDropzone } from './attachment-dropzone';

const TIER_LABELS: Record<'fixed' | 'needs' | 'wants', string> = {
  fixed: 'Fixed',
  needs: 'Needs',
  wants: 'Wants',
};

type ExpenseFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ExpenseInput> & { id?: string };
  onSuccess: () => void;
};

export function ExpenseForm({
  mode,
  defaultValues,
  onSuccess,
}: ExpenseFormProps) {
  const { user } = useAuth();
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const grouped = useMemo(
    () => (categories ? groupByTier(categories) : null),
    [categories]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      currency: defaultValues?.currency ?? 'IDR',
      category_id: defaultValues?.category_id ?? '',
      occurred_at: defaultValues?.occurred_at ?? new Date(),
      note: defaultValues?.note ?? '',
    },
  });

  const currency = useWatch({ control, name: 'currency' });

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error('You need to be signed in to log an expense.');
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      toast.error('Missing expense id for edit.');
      return;
    }
    try {
      const { exchange_rate_to_idr } = await convertToIdr({
        amount: values.amount,
        currency: values.currency,
      });
      const trimmedNote = values.note?.trim();
      const basePayload = {
        user_id: user.id,
        amount: values.amount,
        currency: values.currency,
        category_id: values.category_id,
        occurred_at: toIsoDate(values.occurred_at),
        note: trimmedNote ? trimmedNote : null,
        source: 'manual' as const,
        exchange_rate_to_idr,
      };

      if (mode === 'edit') {
        // TODO: support replacing/removing attachments in edit mode.
        const { error } = await updateExpense(defaultValues!.id!, basePayload);
        if (error) throw error;
        toast.success('Expense updated');
        onSuccess();
        return;
      }

      if (!attachment) {
        const { error } = await createExpense(basePayload);
        if (error) throw error;
        toast.success('Expense added');
        onSuccess();
        return;
      }

      const upload = await uploadAttachment(attachment, {
        userId: user.id,
        occurredAt: values.occurred_at,
      });
      if (upload.error || !upload.data) throw upload.error ?? new Error('Upload failed');
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
      });
      if (confirm.error) {
        console.warn('Attachment confirm step failed', confirm.error);
      }

      toast.success('Expense added');
      onSuccess();
    } catch (err) {
      console.error('Failed to save expense', err);
      toast.error('Could not save expense. Please try again.');
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <Field
            data-invalid={errors.amount ? true : undefined}
            className='sm:col-span-2'
          >
            <FieldLabel htmlFor='expense-amount'>Amount</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <span className='text-sm font-medium text-muted-foreground'>
                  {currency}
                </span>
              </InputGroupAddon>
              <InputGroupInput
                id='expense-amount'
                type='number'
                inputMode='decimal'
                step='0.01'
                min='0'
                placeholder='0.00'
                autoFocus
                aria-invalid={errors.amount ? true : undefined}
                {...register('amount', { valueAsNumber: true })}
              />
            </InputGroup>
            <FieldError
              errors={errors.amount ? [errors.amount] : undefined}
            />
          </Field>

          <Controller
            control={control}
            name='currency'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor='expense-currency'>Currency</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id='expense-currency'
                    className='w-full'
                    aria-invalid={fieldState.invalid || undefined}
                  >
                    <SelectValue placeholder='Currency' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='IDR'>IDR</SelectItem>
                    <SelectItem value='USD'>USD</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />
        </div>

        <Controller
          control={control}
          name='category_id'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='expense-category'>Category</FieldLabel>
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
                        ? 'Loading categories…'
                        : categoriesError
                          ? 'Failed to load categories'
                          : 'Pick a category'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {grouped &&
                    (['fixed', 'needs', 'wants'] as const).map((tier) => {
                      const items = grouped[tier];
                      if (items.length === 0) return null;
                      return (
                        <SelectGroup key={tier}>
                          <SelectLabel>{TIER_LABELS[tier]}</SelectLabel>
                          {items.map((category) => (
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
              <FieldLabel htmlFor='expense-date'>Date</FieldLabel>
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
          <FieldLabel htmlFor='expense-note'>Note (optional)</FieldLabel>
          <Textarea
            id='expense-note'
            rows={3}
            placeholder='What was this for?'
            aria-invalid={errors.note ? true : undefined}
            {...register('note')}
          />
          <FieldError errors={errors.note ? [errors.note] : undefined} />
        </Field>

        {mode === 'create' && (
          <Field>
            <FieldLabel>Receipt (optional)</FieldLabel>
            <AttachmentDropzone
              value={attachment}
              onChange={setAttachment}
              disabled={isSubmitting}
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
              ? 'Add expense'
              : 'Update expense'}
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
