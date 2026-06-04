import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

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
import { categorySchema, TIERS, type CategoryInput } from '../schemas';
import { PRESET_COLORS } from '../lib/colors';
import { ColorPicker } from './color-picker';
import { IconPicker } from './icon-picker';

const TIER_LABELS: Record<(typeof TIERS)[number], string> = {
  fixed: 'Fixed',
  needs: 'Needs',
  wants: 'Wants',
};

type CategoryFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CategoryInput> & { id?: string };
  onSuccess: () => void;
};

export function CategoryForm({
  mode,
  defaultValues,
  onSuccess,
}: CategoryFormProps) {
  const { user } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      tier: defaultValues?.tier ?? 'needs',
      icon: defaultValues?.icon ?? '',
      color: defaultValues?.color ?? PRESET_COLORS[0],
    },
  });

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error('You need to be signed in to manage categories.');
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      toast.error('Missing category id for edit.');
      return;
    }
    try {
      if (mode === 'edit') {
        const { error } = await updateCategory(defaultValues!.id!, values);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await createCategory({ ...values, user_id: user.id });
        if (error) throw error;
        toast.success('Category added');
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save category', err);
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not save category. Please try again.';
      toast.error(message);
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor='category-name'>Name</FieldLabel>
          <Input
            id='category-name'
            type='text'
            autoFocus
            placeholder='Groceries'
            aria-invalid={errors.name ? true : undefined}
            {...register('name')}
          />
          <FieldError errors={errors.name ? [errors.name] : undefined} />
        </Field>

        <Controller
          control={control}
          name='tier'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='category-tier'>Tier</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id='category-tier'
                  className='w-full'
                  aria-invalid={fieldState.invalid || undefined}
                >
                  <SelectValue placeholder='Pick a tier' />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {TIER_LABELS[tier]}
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
              <FieldLabel htmlFor='category-icon'>Icon</FieldLabel>
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
              <FieldLabel htmlFor='category-color'>Color</FieldLabel>
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
              ? 'Saving…'
              : 'Updating…'
            : mode === 'create'
              ? 'Add category'
              : 'Update category'}
        </Button>
      </FieldGroup>
    </form>
  );
}
