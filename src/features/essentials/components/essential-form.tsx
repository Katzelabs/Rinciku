import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { stepForCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';
import { useAuth } from '@/features/auth';
import {
  groupByTier,
  useCategories,
  useTiers,
} from '@/features/categories/hooks/use-categories';

import { createEssential, updateEssential } from '../api';
import { essentialSchema, type EssentialInput } from '../schemas';

type EssentialFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<EssentialInput> & { id?: string };
  onSuccess: () => void;
};

export function EssentialForm({
  mode,
  defaultValues,
  onSuccess,
}: EssentialFormProps) {
  const { user, profile } = useAuth();
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const { data: tiers } = useTiers();

  const grouped = useMemo(
    () => (categories ? groupByTier(categories, tiers ?? []) : null),
    [categories, tiers]
  );

  // On create, currency is locked to the user's current base. On edit, preserve
  // the row's stored currency so existing rows are not silently rewritten.
  const baseCurrency = (profile?.base_currency ?? 'IDR') as CurrencyCode;
  const lockedCurrency: CurrencyCode = defaultValues?.currency ?? baseCurrency;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EssentialInput>({
    resolver: zodResolver(essentialSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      estimated_amount:
        defaultValues?.estimated_amount ?? (undefined as unknown as number),
      currency: lockedCurrency,
      category_id: defaultValues?.category_id ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  const currency = useWatch({ control, name: 'currency' });
  const categoryId = useWatch({ control, name: 'category_id' });

  useEffect(() => {
    if (mode !== 'create') return;
    if (categoryId) return;
    const firstCategory = grouped?.find((g) => g.categories.length > 0)
      ?.categories[0]?.id;
    if (firstCategory) setValue('category_id', firstCategory);
  }, [mode, categoryId, grouped, setValue]);

  const submit = handleSubmit(async (values) => {
    if (!user) {
      toast.error('You need to be signed in to save an essential.');
      return;
    }
    if (mode === 'edit' && !defaultValues?.id) {
      toast.error('Missing essential id for edit.');
      return;
    }
    try {
      const basePayload = {
        name: values.name.trim(),
        estimated_amount: values.estimated_amount,
        currency: values.currency,
        category_id: values.category_id,
      };

      if (mode === 'edit') {
        const { error } = await updateEssential(
          defaultValues!.id!,
          basePayload
        );
        if (error) throw error;
        toast.success('Essential updated');
        onSuccess();
        return;
      }

      const { error } = await createEssential({
        user_id: user.id,
        ...basePayload,
      });
      if (error) throw error;
      toast.success('Essential added');
      onSuccess();
    } catch (err) {
      console.error('Failed to save essential', err);
      toast.error('Could not save essential. Please try again.');
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor='essential-name'>Name</FieldLabel>
          <Input
            id='essential-name'
            placeholder='Rent, internet, …'
            autoFocus
            aria-invalid={errors.name ? true : undefined}
            {...register('name')}
          />
          <FieldError errors={errors.name ? [errors.name] : undefined} />
        </Field>

        <Field data-invalid={errors.estimated_amount ? true : undefined}>
          <FieldLabel htmlFor='essential-amount'>Estimated amount</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <span className='text-sm font-medium text-muted-foreground'>
                {currency}
              </span>
            </InputGroupAddon>
            <InputGroupInput
              id='essential-amount'
              type='number'
              inputMode='decimal'
              step={stepForCurrency(currency)}
              min='0'
              placeholder='0.00'
              aria-invalid={errors.estimated_amount ? true : undefined}
              {...register('estimated_amount', { valueAsNumber: true })}
            />
          </InputGroup>
          <FieldError
            errors={
              errors.estimated_amount ? [errors.estimated_amount] : undefined
            }
          />
        </Field>

        <Controller
          control={control}
          name='category_id'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='essential-category'>Category</FieldLabel>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={categoriesLoading || !!categoriesError}
              >
                <SelectTrigger
                  id='essential-category'
                  className='w-full'
                  aria-invalid={fieldState.invalid || undefined}
                >
                  <SelectValue
                    placeholder={
                      categoriesLoading
                        ? 'Loading categories…'
                        : categoriesError
                          ? 'Failed to load categories'
                          : 'Pick a category'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {grouped?.map((group) => {
                    if (group.categories.length === 0) return null;
                    const key = group.tier?.id ?? '__untiered__';
                    return (
                      <SelectGroup key={key}>
                        <SelectLabel>
                          {group.tier?.name ?? 'Untiered'}
                        </SelectLabel>
                        {group.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
              <FieldError
                errors={fieldState.error ? [fieldState.error] : undefined}
              />
            </Field>
          )}
        />

        <Field data-invalid={errors.notes ? true : undefined}>
          <FieldLabel htmlFor='essential-notes'>Notes (optional)</FieldLabel>
          <Textarea
            id='essential-notes'
            rows={3}
            placeholder='Anything to remember about this line item?'
            aria-invalid={errors.notes ? true : undefined}
            {...register('notes')}
          />
          <FieldError errors={errors.notes ? [errors.notes] : undefined} />
        </Field>

        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting
            ? mode === 'create'
              ? 'Saving…'
              : 'Updating…'
            : mode === 'create'
              ? 'Add essential'
              : 'Update essential'}
        </Button>
      </FieldGroup>
    </form>
  );
}
