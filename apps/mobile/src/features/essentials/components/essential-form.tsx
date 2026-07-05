import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { type CurrencyCode } from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { CategorySelect } from '@/components/category-select';
import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { Button } from '@/features/auth/components/button';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { createEssential, updateEssential } from '@/features/essentials/api';
import {
  makeEssentialSchema,
  type EssentialInput,
} from '@/features/essentials/schemas';

type Props = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<EssentialInput> & { id?: string };
  onSuccess: () => void;
};

// Create/edit form for a monthly essential. Currency is locked to the user's
// base currency (the baseline is computed in base), so there's no currency
// picker — just amount, name, category, and optional notes.
export function EssentialForm({ mode, defaultValues, onSuccess }: Props) {
  const { t } = useTranslation('essentials');
  const { user, profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const schema = useMemo(() => makeEssentialSchema(t), [t]);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EssentialInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      estimated_amount: defaultValues?.estimated_amount ?? undefined,
      currency: (defaultValues?.currency ?? base) as CurrencyCode,
      category_id: defaultValues?.category_id ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      Alert.alert(t('toast.signInRequired'));
      return;
    }
    const payload = {
      name: values.name,
      estimated_amount: values.estimated_amount,
      currency: values.currency,
      category_id: values.category_id,
      notes: values.notes?.trim() ? values.notes.trim() : null,
    };

    const { error } =
      mode === 'create'
        ? await createEssential({ user_id: user.id, ...payload })
        : defaultValues?.id
          ? await updateEssential(defaultValues.id, payload)
          : { error: new Error('missing id') };

    if (error) {
      Alert.alert(t('toast.saveError'));
      return;
    }
    onSuccess();
  });

  return (
    <View style={styles.form}>
      <TextField
        control={control}
        name='name'
        label={t('form.name.label')}
        placeholder={t('form.name.placeholder')}
        autoCapitalize='sentences'
      />

      <Controller
        control={control}
        name='estimated_amount'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('form.amount.label')}</FieldLabel>
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
            <FieldLabel>{t('form.category.label')}</FieldLabel>
            <CategorySelect
              value={field.value || null}
              onChange={field.onChange}
              invalid={!!fieldState.error}
              placeholder={t('form.category.placeholder')}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />

      <TextField
        control={control}
        name='notes'
        label={t('form.notes.label')}
        placeholder={t('form.notes.placeholder')}
        multiline
      />

      <Button
        label={
          mode === 'create'
            ? t('form.submit.add')
            : t('form.submit.update')
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
