import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/features/auth';

import { createCategory, updateCategory } from '../api';
import { makeCategorySchema, type CategoryInput } from '../schemas';
import type { Tier } from '../hooks/use-categories';
import { PRESET_COLORS } from '../lib/colors';
import { ColorPicker } from './color-picker';
import { IconPicker } from './icon-picker';

type CategoryFormProps = {
  mode: 'create' | 'edit';
  tiers: Tier[];
  defaultValues?: Partial<CategoryInput> & { id?: string };
  onSuccess: () => void;
};

export function CategoryForm({
  mode,
  tiers,
  defaultValues,
  onSuccess,
}: CategoryFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation('categories');
  const schema = useMemo(() => makeCategorySchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      tier_id: defaultValues?.tier_id ?? tiers[0]?.id ?? '',
      icon: defaultValues?.icon ?? '',
      color: defaultValues?.color ?? PRESET_COLORS[0],
    },
  });

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error(t('toast.signInRequiredCategory'));
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      toast.error(t('toast.missingCategoryId'));
      return;
    }
    try {
      if (mode === 'edit') {
        const { error } = await updateCategory(defaultValues!.id!, values);
        if (error) throw error;
        toast.success(t('toast.categoryUpdated'));
      } else {
        const { error } = await createCategory({ ...values, user_id: user.id });
        if (error) throw error;
        toast.success(t('toast.categoryAdded'));
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save category', err);
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('toast.saveCategoryError');
      toast.error(message);
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor='category-name'>{t('form.name')}</FieldLabel>
          <Input
            id='category-name'
            type='text'
            autoFocus
            placeholder={t('form.categoryNamePlaceholder')}
            aria-invalid={errors.name ? true : undefined}
            {...register('name')}
          />
          <FieldError errors={errors.name ? [errors.name] : undefined} />
        </Field>

        <Controller
          control={control}
          name='tier_id'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='category-tier'>{t('form.tier')}</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id='category-tier'
                  className='w-full'
                  aria-invalid={fieldState.invalid || undefined}
                >
                  <SelectValue placeholder={t('form.pickTier')} />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                errors={fieldState.error ? [fieldState.error] : undefined}
              />
            </Field>
          )}
        />

        <Controller
          control={control}
          name='icon'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='category-icon'>{t('form.icon')}</FieldLabel>
              <IconPicker
                id='category-icon'
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
              <FieldLabel htmlFor='category-color'>
                {t('form.color')}
              </FieldLabel>
              <ColorPicker
                id='category-color'
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
              ? t('buttons.saving')
              : t('buttons.updating')
            : mode === 'create'
              ? t('buttons.addCategory')
              : t('buttons.updateCategory')}
        </Button>
      </FieldGroup>
    </form>
  );
}
