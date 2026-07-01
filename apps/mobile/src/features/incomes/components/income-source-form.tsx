import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ColorPicker } from '@/features/categories/components/color-picker';
import { IconPicker } from '@/features/categories/components/icon-picker';
import { PRESET_COLORS } from '@/features/categories/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/features/auth/components/button';
import { Notice } from '@/features/auth/components/notice';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import {
  createIncomeCategory,
  updateIncomeCategory,
} from '@/features/incomes/api';
import {
  makeIncomeCategorySchema,
  type IncomeCategoryInput,
} from '@/features/incomes/schemas';

interface IncomeSourceFormProps {
  mode: 'create' | 'edit';
  nextSortOrder?: number;
  defaultValues?: Partial<IncomeCategoryInput> & { id?: string };
  onSuccess: () => void;
}

// Create/edit form for an income source (flat taxonomy — name, icon, color).
// Mirrors CategoryForm minus the tier select.
export function IncomeSourceForm({
  mode,
  nextSortOrder,
  defaultValues,
  onSuccess,
}: IncomeSourceFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation('incomes');
  const schema = useMemo(() => makeIncomeCategorySchema(t), [t]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IncomeCategoryInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      icon: defaultValues?.icon ?? '',
      color: defaultValues?.color ?? PRESET_COLORS[0],
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    if (!user) {
      setSubmitError(t('categoryForm.needSignIn'));
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      setSubmitError(t('categoryForm.missingId'));
      return;
    }
    const { error } =
      mode === 'edit'
        ? await updateIncomeCategory(defaultValues!.id!, values)
        : await createIncomeCategory({
            ...values,
            user_id: user.id,
            sort_order: nextSortOrder,
          });
    if (error) {
      setSubmitError(t('categoryForm.saveError'));
      return;
    }
    onSuccess();
  });

  return (
    <View style={styles.form}>
      <TextField
        control={control}
        name='name'
        label={t('categoryForm.name')}
        placeholder={t('categoryForm.namePlaceholder')}
        autoFocus
      />

      <Controller
        control={control}
        name='icon'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('categoryForm.icon')}</FieldLabel>
            <IconPicker
              value={field.value}
              onChange={field.onChange}
              invalid={!!fieldState.error}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />

      <Controller
        control={control}
        name='color'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('categoryForm.color')}</FieldLabel>
            <ColorPicker
              value={field.value}
              onChange={field.onChange}
              invalid={!!fieldState.error}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />

      {submitError ? <Notice tone='error'>{submitError}</Notice> : null}

      <Button
        label={
          mode === 'create'
            ? t('categoryForm.submitCreate')
            : t('categoryForm.submitEdit')
        }
        loading={isSubmitting}
        onPress={submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  field: { gap: Spacing.two },
});
