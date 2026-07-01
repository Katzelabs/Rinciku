import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { type CurrencyCode } from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { CategorySelect } from '@/components/category-select';
import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { DateField } from '@/components/date-field';
import { Button } from '@/features/auth/components/button';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { createExpense, updateExpense } from '@/features/expenses/api';
import {
  makeExpenseSchema,
  type ExpenseInput,
} from '@/features/expenses/schemas';

type Props = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ExpenseInput> & { id?: string };
  onSuccess: () => void;
};

// Create/edit form for an expense. Currency is locked to the user's base
// currency; attachments are web-only for now (deferred per the M8 plan).
export function ExpenseForm({ mode, defaultValues, onSuccess }: Props) {
  const { t } = useTranslation('expenses');
  const { user, profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const schema = useMemo(() => makeExpenseSchema(t), [t]);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: defaultValues?.amount ?? undefined,
      currency: (defaultValues?.currency ?? base) as CurrencyCode,
      category_id: defaultValues?.category_id ?? '',
      occurred_at: defaultValues?.occurred_at ?? new Date(),
      note: defaultValues?.note ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      Alert.alert(t('toast.signInRequired'));
      return;
    }
    const note = values.note?.trim() ? values.note.trim() : null;

    const { error } =
      mode === 'create'
        ? await createExpense({
            user_id: user.id,
            amount: values.amount,
            currency: values.currency,
            category_id: values.category_id,
            occurred_at: values.occurred_at.toISOString(),
            note,
            source: 'manual',
          })
        : defaultValues?.id
          ? await updateExpense(defaultValues.id, {
              amount: values.amount,
              currency: values.currency,
              category_id: values.category_id,
              occurred_at: values.occurred_at.toISOString(),
              note,
            })
          : { error: new Error('missing id') };

    if (error) {
      Alert.alert(t('toast.saveError'));
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
        name='category_id'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('form.category')}</FieldLabel>
            <CategorySelect
              value={field.value || null}
              onChange={field.onChange}
              invalid={!!fieldState.error}
              placeholder={t('form.categoryPlaceholder')}
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

      <Button
        label={mode === 'create' ? t('form.submitCreate') : t('form.submitEdit')}
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
