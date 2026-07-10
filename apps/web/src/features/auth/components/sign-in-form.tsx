import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import { useCaptcha } from './captcha';
import { makeSignInSchema, type SignInInput } from '../schemas';

interface SignInFormProps {
  onSubmit: (
    values: SignInInput,
    helpers: {
      setRootError: (message: string) => void;
      captchaToken?: string;
    }
  ) => Promise<void> | void;
}

export function SignInForm({ onSubmit }: SignInFormProps) {
  const { t } = useTranslation('auth');
  const [showPassword, setShowPassword] = useState(false);
  const schema = useMemo(() => makeSignInSchema(t), [t]);
  const captcha = useCaptcha();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      await onSubmit(values, {
        setRootError: (message) => setError('root', { message }),
        captchaToken: captcha.token,
      });
    } finally {
      // Turnstile tokens are single-use — request a fresh one for a retry.
      captcha.reset();
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor='sign-in-email'>{t('fields.email')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MailIcon />
            </InputGroupAddon>
            <InputGroupInput
              id='sign-in-email'
              type='email'
              autoComplete='email'
              autoFocus
              placeholder={t('fields.emailPlaceholder')}
              aria-invalid={errors.email ? true : undefined}
              {...register('email')}
            />
          </InputGroup>
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>

        <Field data-invalid={errors.password ? true : undefined}>
          <div className='flex items-center justify-between'>
            <FieldLabel htmlFor='sign-in-password'>
              {t('fields.password')}
            </FieldLabel>
            <Link
              to='/forgot-password'
              className='text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
            >
              {t('signInForm.forgotPassword')}
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
              placeholder={t('signInForm.passwordPlaceholder')}
              aria-invalid={errors.password ? true : undefined}
              {...register('password')}
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='icon-xs'
                aria-label={
                  showPassword
                    ? t('fields.hidePassword')
                    : t('fields.showPassword')
                }
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

        {captcha.widget}

        <Button type='submit' disabled={isSubmitting || !captcha.ready}>
          {isSubmitting && <Spinner data-icon='inline-start' />}
          {isSubmitting ? t('signInForm.submitting') : t('signInForm.submit')}
        </Button>
      </FieldGroup>
    </form>
  );
}
