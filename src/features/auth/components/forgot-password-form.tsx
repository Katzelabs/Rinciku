import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { MailIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas';

interface ForgotPasswordFormProps {
  onSubmit: (
    values: ForgotPasswordInput,
    helpers: { setRootError: (message: string) => void }
  ) => Promise<void> | void;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    await onSubmit(values, {
      setRootError: (message) => setError('root', { message }),
    });
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor='forgot-password-email'>Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MailIcon />
            </InputGroupAddon>
            <InputGroupInput
              id='forgot-password-email'
              type='email'
              autoComplete='email'
              autoFocus
              placeholder='you@example.com'
              aria-invalid={errors.email ? true : undefined}
              {...register('email')}
            />
          </InputGroup>
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>

        <FieldError errors={errors.root ? [errors.root] : undefined} />

        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </FieldGroup>
    </form>
  );
}
