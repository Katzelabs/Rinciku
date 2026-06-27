import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
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
import { CurrencyAmountInput } from '@/components/shared/currency-amount-input';
import { CurrencySelect } from '@/components/shared/currency-select';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/locale';
import type { CurrencyCode } from '@/lib/fx';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';
import {
  groupByTier,
  useCategories,
  useTiers,
} from '@/features/categories/hooks/use-categories';
import { confirmExpenseProposal } from '../api';
import { makeExpenseConfirmSchema, type ExpenseConfirmInput } from '../schemas';
import type { PendingAttachment, ProposedTransaction } from '../types';
import { matchCategoryId, toIsoDate } from './proposal-utils';

type Props = {
  proposal: ProposedTransaction;
  attachment: PendingAttachment | null;
  onConfirmed: (note: string) => void;
  onCancel: () => void;
};

export function ExpenseProposalCard({
  proposal,
  attachment,
  onConfirmed,
  onCancel,
}: Props) {
  const { t } = useTranslation('aiChat');
  const { user } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: tiers } = useTiers();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const schema = useMemo(() => makeExpenseConfirmSchema(t), [t]);

  const grouped = useMemo(
    () => (categories ? groupByTier(categories, tiers ?? []) : null),
    [categories, tiers]
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ExpenseConfirmInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: proposal.amount,
      currency: proposal.currency,
      category_id: matchCategoryId(proposal.category_hint, categories) ?? '',
      occurred_at: new Date(`${proposal.occurred_at}T00:00:00`),
      note: proposal.note ?? '',
    },
  });

  const currency = useWatch({ control, name: 'currency' });

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error(t('toast.signInRequired'));
      return;
    }
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
      toast.error(t('toast.expenseSaveError'));
      return;
    }
    toast.success(t('toast.expenseLogged'));
    const amount = formatCurrency(values.amount, values.currency);
    onConfirmed(
      note
        ? t('proposal.loggedExpenseNote', { amount, note })
        : t('proposal.loggedExpense', { amount })
    );
  });

  return (
    <Card className='border-primary/30 bg-primary/[0.03]'>
      <CardHeader className='flex-row items-center gap-2 space-y-0 pb-2'>
        <Sparkles className='size-4 text-primary' />
        <span className='text-sm font-medium'>{t('proposal.reviewExpense')}</span>
        {proposal.confidence != null ? (
          <span className='ml-auto text-xs text-muted-foreground'>
            {t('proposal.confident', {
              percent: Math.round(proposal.confidence * 100),
            })}
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        <form id='expense-proposal' onSubmit={submit} noValidate>
          <FieldGroup>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Controller
                control={control}
                name='amount'
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor='ep-amount'>
                      {t('proposal.amount')}
                    </FieldLabel>
                    <CurrencyAmountInput
                      id='ep-amount'
                      currency={currency as CurrencyCode}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      name={field.name}
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
                name='currency'
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor='ep-currency'>
                      {t('proposal.currency')}
                    </FieldLabel>
                    <CurrencySelect
                      id='ep-currency'
                      value={field.value as CurrencyCode}
                      onChange={field.onChange}
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
                  <FieldLabel htmlFor='ep-category'>
                    {t('proposal.category')}
                  </FieldLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger
                      id='ep-category'
                      className='w-full'
                      aria-invalid={fieldState.invalid || undefined}
                    >
                      <SelectValue
                        placeholder={
                          categoriesLoading
                            ? t('proposal.loadingCategories')
                            : t('proposal.pickCategory')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {grouped?.map((group) => {
                        if (group.categories.length === 0) return null;
                        return (
                          <SelectGroup key={group.tier?.id ?? '__untiered__'}>
                            <SelectLabel>
                              {group.tier?.name ?? t('proposal.untiered')}
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
                  <FieldLabel htmlFor='ep-date'>{t('proposal.date')}</FieldLabel>
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id='ep-date'
                        type='button'
                        variant='outline'
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 size-4' />
                        {field.value
                          ? formatDate(field.value, 'd MMM yyyy')
                          : t('proposal.pickDate')}
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

            <Controller
              control={control}
              name='note'
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='ep-note'>{t('proposal.note')}</FieldLabel>
                  <Textarea
                    id='ep-note'
                    rows={2}
                    placeholder={t('proposal.expenseNotePlaceholder')}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('common:actions.cancel')}
        </Button>
        <Button type='submit' form='expense-proposal' disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting
            ? t('common:actions.saving')
            : t('proposal.confirmExpense')}
        </Button>
      </CardFooter>
    </Card>
  );
}
