import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/features/auth';

import { createTier, updateTier } from '../api';
import { makeTierSchema, type TierInput } from '../schemas';
import { PRESET_COLORS } from '../lib/colors';
import { ColorPicker } from './color-picker';

type TierFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<TierInput> & { id?: string };
  // Where a newly created tier should land in the ordering (append at the end).
  nextSortOrder?: number;
  onSuccess: () => void;
};

export function TierForm({
  mode,
  defaultValues,
  nextSortOrder,
  onSuccess,
}: TierFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation('categories');
  const schema = useMemo(() => makeTierSchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TierInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      color: defaultValues?.color ?? PRESET_COLORS[0],
      is_essential: defaultValues?.is_essential ?? false,
    },
  });

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error(t('toast.signInRequiredTier'));
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      toast.error(t('toast.missingTierId'));
      return;
    }
    try {
      if (mode === 'edit') {
        const { error } = await updateTier(defaultValues!.id!, values);
        if (error) throw error;
        toast.success(t('toast.tierUpdated'));
      } else {
        const { error } = await createTier({
          ...values,
          user_id: user.id,
          sort_order: nextSortOrder,
        });
        if (error) throw error;
        toast.success(t('toast.tierAdded'));
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save tier', err);
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('toast.saveTierError');
      toast.error(message);
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor='tier-name'>{t('form.name')}</FieldLabel>
          <Input
            id='tier-name'
            type='text'
            autoFocus
            placeholder={t('form.tierNamePlaceholder')}
            aria-invalid={errors.name ? true : undefined}
            {...register('name')}
          />
          <FieldError errors={errors.name ? [errors.name] : undefined} />
        </Field>

        <Controller
          control={control}
          name='color'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='tier-color'>{t('form.color')}</FieldLabel>
              <ColorPicker
                id='tier-color'
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
          name='is_essential'
          render={({ field }) => (
            <Field orientation='horizontal'>
              <div className='flex flex-1 flex-col'>
                <FieldLabel htmlFor='tier-essential'>
                  {t('form.essential')}
                </FieldLabel>
                <FieldDescription>
                  {t('form.essentialDescription')}
                </FieldDescription>
              </div>
              <Switch
                id='tier-essential'
                checked={field.value}
                onCheckedChange={field.onChange}
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
              ? t('buttons.addTier')
              : t('buttons.updateTier')}
        </Button>
      </FieldGroup>
    </form>
  );
}
