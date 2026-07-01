import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { type CurrencyCode } from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { DateField } from '@/components/date-field';
import { Button } from '@/features/auth/components/button';
import { Notice } from '@/features/auth/components/notice';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { createIncome, updateIncome } from '@/features/incomes/api';
import { IncomeSourceSelect } from '@/features/incomes/components/income-source-select';
import { makeIncomeSchema, type IncomeInput } from '@/features/incomes/schemas';

type Props = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<IncomeInput> & { id?: string };
  onSuccess: () => void;
};

// Create/edit form for an income. Currency is locked to the user's base
// currency; the source (income category) is optional. Save errors surface inline
// via a Notice rather than a blocking Alert.
export function IncomeForm({ mode, defaultValues, onSuccess }: Props) {
  const { t } = useTranslation('incomes');
  const { user, profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const schema = useMemo(() => makeIncomeSchema(t), [t]);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

    const { error } =
      mode === 'create'
        ? await createIncome({
            user_id: user.id,
            source_id,
            amount: values.amount,
            currency: base,
            occurred_at: values.occurred_at.toISOString(),
            note,
            source: 'manual',
          })
        : defaultValues?.id
          ? await updateIncome(defaultValues.id, {
              source_id,
              amount: values.amount,
              currency: base,
              occurred_at: values.occurred_at.toISOString(),
              note,
            })
          : { error: new Error('missing id') };

    if (error) {
      setSubmitError(t('toast.saveError'));
      return;
    }
    onSuccess();
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name='amount'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('form.amount')}</FieldLabel>
            <CurrencyAmountInput
              currency={base}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={!!fieldState.error}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
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
