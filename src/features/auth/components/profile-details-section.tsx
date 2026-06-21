import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const profileDetailsSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(80, 'Keep it under 80 characters'),
});

type ProfileDetailsInput = z.infer<typeof profileDetailsSchema>;

export function ProfileDetailsSection() {
  const { user, profile, refreshProfile } = useAuth();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileDetailsInput>({
    resolver: zodResolver(profileDetailsSchema),
    values: { display_name: profile?.display_name ?? '' },
  });

  async function onSubmit(values: ProfileDetailsInput) {
    if (!user) return;
    try {
      await updateProfile(user.id, values);
      await refreshProfile();
      reset(values);
      toast.success('Profile updated');
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error('Could not update your profile. Please try again.');
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            How you appear in Rinciku and the email tied to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={control}
              name='display_name'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor='settings-display-name'>
                    Display name
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
              <FieldLabel htmlFor='settings-email'>Email</FieldLabel>
              <Input
                id='settings-email'
                value={user?.email ?? ''}
                readOnly
                disabled
              />
              <FieldDescription>
                Your sign-in email can't be changed here.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className='justify-end border-t'>
          <Button type='submit' disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Spinner data-icon='inline-start' />}
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
