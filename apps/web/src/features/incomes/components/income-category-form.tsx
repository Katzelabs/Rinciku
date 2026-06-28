import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/features/auth';
import { ColorPicker } from '@/features/categories/components/color-picker';
import { IconPicker } from '@/features/categories/components/icon-picker';
import { PRESET_COLORS } from '@/features/categories/lib/colors';

import { createIncomeCategory, updateIncomeCategory } from '../api';
import { makeIncomeCategorySchema, type IncomeCategoryInput } from '../schemas';

type IncomeCategoryFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<IncomeCategoryInput> & { id?: string };
  sortOrder?: number;
  onSuccess: () => void;
};

export function IncomeCategoryForm({
  mode,
  defaultValues,
  sortOrder,
  onSuccess,
}: IncomeCategoryFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation('incomes');
  const schema = useMemo(() => makeIncomeCategorySchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeCategoryInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      icon: defaultValues?.icon ?? '',
      color: defaultValues?.color ?? PRESET_COLORS[0],
    },
  });

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error(t('categoryForm.needSignIn'));
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      toast.error(t('categoryForm.missingId'));
      return;
    }
    try {
      if (mode === 'edit') {
        const { error } = await updateIncomeCategory(
          defaultValues!.id!,
          values
        );
        if (error) throw error;
        toast.success(t('categoryForm.updated'));
      } else {
        const { error } = await createIncomeCategory({
          ...values,
          user_id: user.id,
          sort_order: sortOrder,
        });
        if (error) throw error;
        toast.success(t('categoryForm.added'));
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save income category', err);
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('categoryForm.saveError');
      toast.error(message);
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor='income-category-name'>
            {t('categoryForm.name')}
          </FieldLabel>
          <Input
            id='income-category-name'
            type='text'
            autoFocus
            placeholder={t('categoryForm.namePlaceholder')}
            aria-invalid={errors.name ? true : undefined}
            {...register('name')}
          />
          <FieldError errors={errors.name ? [errors.name] : undefined} />
        </Field>

        <Controller
          control={control}
          name='icon'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='income-category-icon'>
                {t('categoryForm.icon')}
              </FieldLabel>
              <IconPicker
                id='income-category-icon'
                value={field.value}
                onChange={field.onChange}
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
          name='color'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='income-category-color'>
                {t('categoryForm.color')}
              </FieldLabel>
              <ColorPicker
                id='income-category-color'
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
              />
              <FieldError
                errors={fieldState.error ? [fieldState.error] : undefined}
              />
            </Field>
          )}
        />

        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting
            ? mode === 'create'
              ? t('categoryForm.saving')
              : t('categoryForm.updating')
            : mode === 'create'
              ? t('categoryForm.submitCreate')
              : t('categoryForm.submitEdit')}
        </Button>
      </FieldGroup>
    </form>
  );
}
