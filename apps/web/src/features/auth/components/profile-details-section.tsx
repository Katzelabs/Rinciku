import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '../hooks/use-auth';
import { updateProfile } from '../api';
import { makeOnboardingSchema, type OnboardingInput } from '../schemas';

type ProfileDetailsInput = Pick<OnboardingInput, 'display_name'>;

export function ProfileDetailsSection() {
  const { t } = useTranslation('auth');
  const { user, profile, refreshProfile } = useAuth();
  const schema = useMemo(
    () => makeOnboardingSchema(t).pick({ display_name: true }),
    [t]
  );
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileDetailsInput>({
    resolver: zodResolver(schema),
    values: { display_name: profile?.display_name ?? '' },
  });

  async function onSubmit(values: ProfileDetailsInput) {
    if (!user) return;
    try {
      await updateProfile(user.id, values);
      await refreshProfile();
      reset(values);
      toast.success(t('profileDetails.updated'));
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error(t('profileDetails.updateError'));
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardHeader>
          <CardTitle>{t('profileDetails.title')}</CardTitle>
          <CardDescription>{t('profileDetails.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={control}
              name='display_name'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor='settings-display-name'>
                    {t('profileFields.displayName')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id='settings-display-name'
                    autoComplete='name'
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : undefined}
                  />
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor='settings-email'>
                {t('profileDetails.email')}
              </FieldLabel>
              <Input
                id='settings-email'
                value={user?.email ?? ''}
                readOnly
                disabled
              />
              <FieldDescription>
                {t('profileDetails.emailHint')}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className='justify-end mt-6'>
          <Button type='submit' disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Spinner data-icon='inline-start' />}
            {isSubmitting
              ? t('common:actions.saving')
              : t('common:actions.save')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
