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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyAmountInput } from '@/components/shared/currency-amount-input';
import { CurrencySelect } from '@/components/shared/currency-select';
import { formatCurrency } from '@rinciku/core';
import { formatDate } from '@rinciku/core';
import type { CurrencyCode } from '@rinciku/core';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';
import { useIncomeCategories } from '@/features/incomes/hooks/use-income-categories';
import { confirmIncomeProposal } from '../api';
import { makeIncomeConfirmSchema, type IncomeConfirmInput } from '../schemas';
import type { PendingAttachment, ProposedTransaction } from '../types';
import { matchCategoryId, toIsoDate } from './proposal-utils';

// Radix Select cannot hold an empty value, so "no source" uses this sentinel.
const NO_SOURCE = '__none__';

type Props = {
  proposal: ProposedTransaction;
  attachment: PendingAttachment | null;
  onConfirmed: (note: string) => void;
  onCancel: () => void;
};

export function IncomeProposalCard({
  proposal,
  attachment,
  onConfirmed,
  onCancel,
}: Props) {
  const { t } = useTranslation('aiChat');
  const { user } = useAuth();
  const { data: sources, isLoading: sourcesLoading } = useIncomeCategories();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const schema = useMemo(() => makeIncomeConfirmSchema(t), [t]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IncomeConfirmInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: proposal.amount,
      currency: proposal.currency,
      source_id: matchCategoryId(proposal.category_hint, sources) ?? '',
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
      toast.error(t('toast.incomeSaveError'));
      return;
    }
    toast.success(t('toast.incomeLogged'));
    const amount = formatCurrency(values.amount, values.currency);
    onConfirmed(
      note
        ? t('proposal.loggedIncomeNote', { amount, note })
        : t('proposal.loggedIncome', { amount })
    );
  });

  return (
    <Card className='border-primary/30 bg-primary/[0.03]'>
      <CardHeader className='flex-row items-center gap-2 space-y-0 pb-2'>
        <Sparkles className='size-4 text-primary' />
        <span className='text-sm font-medium'>
          {t('proposal.reviewIncome')}
        </span>
        {proposal.confidence != null ? (
          <span className='ml-auto text-xs text-muted-foreground'>
            {t('proposal.confident', {
              percent: Math.round(proposal.confidence * 100),
            })}
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        <form id='income-proposal' onSubmit={submit} noValidate>
          <FieldGroup>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Controller
                control={control}
                name='amount'
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor='ip-amount'>
                      {t('proposal.amount')}
                    </FieldLabel>
                    <CurrencyAmountInput
                      id='ip-amount'
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
                    <FieldLabel htmlFor='ip-currency'>
                      {t('proposal.currency')}
                    </FieldLabel>
                    <CurrencySelect
                      id='ip-currency'
                      value={field.value as CurrencyCode}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={control}
              name='source_id'
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='ip-source'>
                    {t('proposal.source')}
                  </FieldLabel>
                  <Select
                    value={field.value ? field.value : NO_SOURCE}
                    onValueChange={(v) =>
                      field.onChange(v === NO_SOURCE ? '' : v)
                    }
                    disabled={sourcesLoading}
                  >
                    <SelectTrigger id='ip-source' className='w-full'>
                      <SelectValue
                        placeholder={
                          sourcesLoading
                            ? t('proposal.loadingSources')
                            : t('proposal.noSource')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SOURCE}>
                        {t('proposal.noSource')}
                      </SelectItem>
                      {sources?.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <Controller
              control={control}
              name='occurred_at'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor='ip-date'>
                    {t('proposal.date')}
                  </FieldLabel>
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id='ip-date'
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
                  <FieldLabel htmlFor='ip-note'>
                    {t('proposal.note')}
                  </FieldLabel>
                  <Textarea
                    id='ip-note'
                    rows={2}
                    placeholder={t('proposal.incomeNotePlaceholder')}
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
        <Button type='submit' form='income-proposal' disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting
            ? t('common:actions.saving')
            : t('proposal.confirmIncome')}
        </Button>
      </CardFooter>
    </Card>
  );
}
