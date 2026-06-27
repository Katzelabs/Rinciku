import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import type { CurrencyCode } from '@/lib/fx';
import { CurrencyAmountInput } from '@/components/shared/currency-amount-input';

import { makeBudgetTargetSchema, type BudgetTargetInput } from '../schemas';

type TargetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  defaultAmount: number | null;
  // Locked to the user's base on create; preserves the stored currency on edit.
  currency: CurrencyCode;
  onSave: (amount: number, currency: CurrencyCode) => Promise<void>;
  // Provided only when an existing target can be removed (unset).
  onRemove?: () => Promise<void>;
};

export function TargetDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultAmount,
  currency,
  onSave,
  onRemove,
}: TargetDialogProps) {
  const { t } = useTranslation('budgets');
  const [removing, setRemoving] = useState(false);
  const schema = useMemo(() => makeBudgetTargetSchema(t), [t]);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<BudgetTargetInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: defaultAmount ?? (undefined as unknown as number),
      currency,
    },
  });

  // Re-seed the form whenever the dialog opens for a different target.
  useEffect(() => {
    if (open) {
      reset({
        amount: defaultAmount ?? (undefined as unknown as number),
        currency,
      });
    }
  }, [open, defaultAmount, currency, reset]);

  const submit = handleSubmit(async (values) => {
    await onSave(values.amount, values.currency);
  });

  async function handleRemove() {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  }

  const busy = isSubmitting || removing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Controller
              control={control}
              name='amount'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor='target-amount'>
                    {t('dialog.monthlyTarget')}
                  </FieldLabel>
                  <CurrencyAmountInput
                    id='target-amount'
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
            <DialogFooter className='sm:justify-between'>
              {onRemove ? (
                <Button
                  type='button'
                  variant='outline'
                  className='text-destructive hover:text-destructive'
                  onClick={handleRemove}
                  disabled={busy}
                >
                  {removing && <Spinner data-icon='inline-start' />}
                  {removing ? t('dialog.removing') : t('dialog.removeTarget')}
                </Button>
              ) : (
                <span />
              )}
              <Button type='submit' disabled={busy}>
                {isSubmitting && <Spinner data-icon='inline-start' />}
                {isSubmitting ? t('dialog.saving') : t('dialog.saveTarget')}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
