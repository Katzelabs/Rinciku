import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import {
  CheckIcon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import {
  passwordPolicy,
  resetPasswordSchema,
  type ResetPasswordInput,
} from '../schemas';

interface ResetPasswordFormProps {
  onSubmit: (
    values: ResetPasswordInput,
    helpers: { setRootError: (message: string) => void }
  ) => Promise<void> | void;
}

function PasswordRules({ value }: { value: string }) {
  return (
    <ul className='mt-1 grid gap-1 text-xs' aria-live='polite'>
      {passwordPolicy.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              ok ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {ok ? (
              <CheckIcon className='size-3.5 text-primary' aria-hidden />
            ) : (
              <CircleIcon className='size-3.5' aria-hidden />
            )}
            <span>{rule.label}</span>
            <span className='sr-only'>{ok ? ' — met' : ' — not yet met'}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ResetPasswordForm({ onSubmit }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = useWatch({ control, name: 'password' }) ?? '';

  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    await onSubmit(values, {
      setRootError: (message) => setError('root', { message }),
    });
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.password ? true : undefined}>
          <FieldLabel htmlFor='reset-password'>New password</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <LockIcon />
            </InputGroupAddon>
            <InputGroupInput
              id='reset-password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='new-password'
              autoFocus
              placeholder='At least 8 characters'
              aria-invalid={errors.password ? true : undefined}
              aria-describedby='reset-password-rules'
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
          <div id='reset-password-rules'>
            <PasswordRules value={passwordValue} />
          </div>
          {passwordValue.length === 0 && errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : null}
        </Field>

        <Field data-invalid={errors.confirmPassword ? true : undefined}>
          <FieldLabel htmlFor='reset-confirm-password'>
            Confirm password
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <LockIcon />
            </InputGroupAddon>
            <InputGroupInput
              id='reset-confirm-password'
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete='new-password'
              placeholder='Repeat your password'
              aria-invalid={errors.confirmPassword ? true : undefined}
              {...register('confirmPassword')}
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='icon-xs'
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((value) => !value)}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError
            errors={
              errors.confirmPassword ? [errors.confirmPassword] : undefined
            }
          />
        </Field>

        <FieldError errors={errors.root ? [errors.root] : undefined} />

        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </FieldGroup>
    </form>
  );
}
