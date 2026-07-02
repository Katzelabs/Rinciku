import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { CurrencyCode } from '@rinciku/core';

import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { Spacing } from '@/constants/theme';
import { Button, FieldError, FieldLabel, Sheet } from '@/components/ui';
import {
  makeBudgetTargetSchema,
  type BudgetTargetInput,
} from '@/features/budgets/schemas';

type TargetModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  defaultAmount: number | null;
  // Locked to the user's base on create; preserves the stored currency on edit.
  currency: CurrencyCode;
  onSave: (amount: number, currency: CurrencyCode) => Promise<void>;
  // Provided only when an existing target can be removed (unset).
  onRemove?: () => Promise<void>;
};

// Bottom-sheet form to set / edit / remove a single budget target. RN counterpart
// to the web TargetDialog; reuses the shared CurrencyAmountInput + Zod schema.
export function TargetModal({
  visible,
  onClose,
  title,
  defaultAmount,
  currency,
  onSave,
  onRemove,
}: TargetModalProps) {
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

  // Re-seed the form whenever the sheet opens for a different target.
  useEffect(() => {
    if (visible) {
      reset({
        amount: defaultAmount ?? (undefined as unknown as number),
        currency,
      });
    }
  }, [visible, defaultAmount, currency, reset]);

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
    <Sheet visible={visible} onClose={onClose} title={title}>
      <Controller
        control={control}
        name='amount'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('dialog.monthlyTarget')}</FieldLabel>
            <CurrencyAmountInput
              currency={currency}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={fieldState.invalid}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />

      <Button
        label={isSubmitting ? t('dialog.saving') : t('dialog.saveTarget')}
        loading={isSubmitting}
        disabled={busy}
        onPress={submit}
      />
      {onRemove ? (
        <Button
          variant='ghost'
          label={removing ? t('dialog.removing') : t('dialog.removeTarget')}
          loading={removing}
          disabled={busy}
          onPress={handleRemove}
        />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
});
