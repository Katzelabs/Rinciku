import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { createTier, updateTier } from '@/features/categories/api';
import { ColorPicker } from '@/features/categories/components/color-picker';
import { SubmitButton } from '@/features/categories/components/category-form';
import { makeTierSchema, type TierInput } from '@/features/categories/schemas';
import { PRESET_COLORS } from '@/features/categories/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Notice } from '@/features/auth/components/notice';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import { useTheme } from '@/hooks/use-theme';

interface TierFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<TierInput> & { id?: string };
  // Where a newly created tier lands in the ordering (append at the end).
  nextSortOrder?: number;
  onSuccess: () => void;
}

export function TierForm({
  mode,
  defaultValues,
  nextSortOrder,
  onSuccess,
}: TierFormProps) {
  const c = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation('categories');
  const schema = useMemo(() => makeTierSchema(t), [t]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<TierInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      color: defaultValues?.color ?? PRESET_COLORS[0],
      is_essential: defaultValues?.is_essential ?? false,
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    if (!user) return;
    if (mode === 'edit' && !defaultValues?.id) return;
    const { error } =
      mode === 'edit'
        ? await updateTier(defaultValues!.id!, values)
        : await createTier({
            ...values,
            user_id: user.id,
            sort_order: nextSortOrder,
          });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    onSuccess();
  });

  return (
    <View style={styles.form}>
      <TextField
        control={control}
        name='name'
        label={t('form.name')}
        placeholder={t('form.tierNamePlaceholder')}
        autoFocus
      />

      <Controller
        control={control}
        name='color'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('form.color')}</FieldLabel>
            <ColorPicker
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
        name='is_essential'
        render={({ field }) => (
          <View style={styles.essentialRow}>
            <View style={styles.essentialText}>
              <FieldLabel>{t('form.essential')}</FieldLabel>
              <Text style={[styles.hint, { color: c.mutedForeground }]}>
                {t('form.essentialDescription')}
              </Text>
            </View>
            <Switch
              value={field.value}
              onValueChange={field.onChange}
              trackColor={{ true: c.primary }}
            />
          </View>
        )}
      />

      {submitError ? <Notice tone='error'>{submitError}</Notice> : null}

      <SubmitButton mode={mode} onPress={submit} which='Tier' />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  field: { gap: Spacing.two },
  essentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  essentialText: { flex: 1, gap: Spacing.half },
  hint: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
});
