import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { createCategory, updateCategory } from '@/features/categories/api';
import { ColorPicker } from '@/features/categories/components/color-picker';
import { IconPicker } from '@/features/categories/components/icon-picker';
import {
  makeCategorySchema,
  type CategoryInput,
} from '@/features/categories/schemas';
import { PRESET_COLORS, type Tier } from '@/features/categories/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/features/auth/components/button';
import { Notice } from '@/features/auth/components/notice';
import {
  FieldError,
  FieldLabel,
  TextField,
} from '@/features/auth/components/text-field';
import { useTheme } from '@/hooks/use-theme';

interface CategoryFormProps {
  mode: 'create' | 'edit';
  tiers: Tier[];
  defaultValues?: Partial<CategoryInput> & { id?: string };
  onSuccess: () => void;
}

export function CategoryForm({
  mode,
  tiers,
  defaultValues,
  onSuccess,
}: CategoryFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation('categories');
  const schema = useMemo(() => makeCategorySchema(t), [t]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<CategoryInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      tier_id: defaultValues?.tier_id ?? tiers[0]?.id ?? '',
      icon: defaultValues?.icon ?? '',
      color: defaultValues?.color ?? PRESET_COLORS[0],
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    if (!user) return;
    if (mode === 'edit' && !defaultValues?.id) return;
    const { error } =
      mode === 'edit'
        ? await updateCategory(defaultValues!.id!, values)
        : await createCategory({ ...values, user_id: user.id });
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
        placeholder={t('form.categoryNamePlaceholder')}
        autoFocus
      />

      <Controller
        control={control}
        name='tier_id'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('form.tier')}</FieldLabel>
            <TierSelect
              tiers={tiers}
              value={field.value}
              onChange={field.onChange}
            />
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />

      <Controller
        control={control}
        name='icon'
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <FieldLabel>{t('form.icon')}</FieldLabel>
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

      {submitError ? <Notice tone='error'>{submitError}</Notice> : null}

      <SubmitButton mode={mode} onPress={submit} which='Category' />
    </View>
  );
}

// Compact pressable list of the user's tiers (max 6, so no scroll needed).
function TierSelect({
  tiers,
  value,
  onChange,
}: {
  tiers: Tier[];
  value: string;
  onChange: (id: string) => void;
}) {
  const c = useTheme();
  return (
    <View style={[styles.tierList, { borderColor: c.border }]}>
      {tiers.map((tier, i) => {
        const selected = tier.id === value;
        return (
          <Pressable
            key={tier.id}
            onPress={() => onChange(tier.id)}
            accessibilityRole='button'
            accessibilityState={{ selected }}
            style={[
              styles.tierRow,
              i > 0 && {
                borderTopColor: c.border,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
              selected && { backgroundColor: c.muted },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: tier.color ?? c.mutedForeground },
              ]}
            />
            <Text style={[styles.tierName, { color: c.foreground }]}>
              {tier.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SubmitButton({
  mode,
  onPress,
  which,
}: {
  mode: 'create' | 'edit';
  onPress: () => void;
  which: 'Category' | 'Tier';
}) {
  const { t } = useTranslation('categories');
  const label =
    mode === 'create' ? t(`buttons.add${which}`) : t(`buttons.update${which}`);
  return <Button label={label} onPress={onPress} />;
}

export { SubmitButton };

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  field: { gap: Spacing.two },
  tierList: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  dot: { width: 10, height: 10, borderRadius: Radius.pill },
  tierName: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
});
