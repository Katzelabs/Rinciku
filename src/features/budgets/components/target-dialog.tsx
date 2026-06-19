import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { stepForCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';

import { budgetTargetSchema, type BudgetTargetInput } from '../schemas';

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
  const [removing, setRemoving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetTargetInput>({
    resolver: zodResolver(budgetTargetSchema),
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
            <Field data-invalid={errors.amount ? true : undefined}>
              <FieldLabel htmlFor='target-amount'>Monthly target</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <span className='text-sm font-medium text-muted-foreground'>
                    {currency}
                  </span>
                </InputGroupAddon>
                <InputGroupInput
                  id='target-amount'
                  type='number'
                  inputMode='decimal'
                  step={stepForCurrency(currency)}
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
                  {removing ? 'Removing…' : 'Remove target'}
                </Button>
              ) : (
                <span />
              )}
              <Button type='submit' disabled={busy}>
                {isSubmitting && <Spinner data-icon='inline-start' />}
                {isSubmitting ? 'Saving…' : 'Save target'}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
