import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from 'lucide-react';
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
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { signInSchema, type SignInInput } from '../schemas';

interface SignInFormProps {
  onSubmit: (
    values: SignInInput,
    helpers: { setRootError: (message: string) => void }
  ) => Promise<void> | void;
}

export function SignInForm({ onSubmit }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
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
          <FieldLabel htmlFor='sign-in-email'>Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MailIcon />
            </InputGroupAddon>
            <InputGroupInput
              id='sign-in-email'
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

        <Field data-invalid={errors.password ? true : undefined}>
          <div className='flex items-center justify-between'>
            <FieldLabel htmlFor='sign-in-password'>Password</FieldLabel>
            <Link
              to='/sign-in'
              className='text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
            >
              Forgot password?
            </Link>
          </div>
          <InputGroup>
            <InputGroupAddon>
              <LockIcon />
            </InputGroupAddon>
            <InputGroupInput
              id='sign-in-password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='current-password'
              placeholder='Your password'
              aria-invalid={errors.password ? true : undefined}
              {...register('password')}
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='icon-xs'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError
            errors={errors.password ? [errors.password] : undefined}
          />
        </Field>

        <FieldError errors={errors.root ? [errors.root] : undefined} />

        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </FieldGroup>
    </form>
  );
}
