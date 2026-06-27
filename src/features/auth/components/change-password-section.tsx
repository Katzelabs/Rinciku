import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckIcon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
} from 'lucide-react';
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
import { updatePassword } from '../api';
import {
  makeChangePasswordSchema,
  passwordPolicy,
  type ChangePasswordInput,
} from '../schemas';

function PasswordRules({ value }: { value: string }) {
  const { t } = useTranslation('auth');
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
            <span>{t(rule.labelKey)}</span>
            <span className='sr-only'>
              {ok ? t('passwordRules.met') : t('passwordRules.notMet')}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function ChangePasswordSection() {
  const { t } = useTranslation('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const schema = useMemo(() => makeChangePasswordSchema(t), [t]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = useWatch({ control, name: 'password' }) ?? '';

  async function onSubmit(values: ChangePasswordInput) {
    const { error } = await updatePassword(values.password);
    if (error) {
      console.error('Failed to update password', error);
      setError('root', {
        message: error.message || t('changePassword.error'),
      });
      return;
    }
    reset({ password: '', confirmPassword: '' });
    toast.success(t('changePassword.updated'));
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardHeader>
          <CardTitle>{t('changePassword.title')}</CardTitle>
          <CardDescription>{t('changePassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={errors.password ? true : undefined}>
              <FieldLabel htmlFor='settings-new-password'>
                {t('fields.newPassword')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <LockIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id='settings-new-password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  placeholder={t('fields.passwordMinPlaceholder')}
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby='settings-password-rules'
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
              <div id='settings-password-rules'>
                <PasswordRules value={passwordValue} />
              </div>
              {passwordValue.length === 0 && errors.password ? (
                <FieldError errors={[errors.password]} />
              ) : null}
            </Field>

            <Field data-invalid={errors.confirmPassword ? true : undefined}>
              <FieldLabel htmlFor='settings-confirm-password'>
                {t('changePassword.confirmNewPassword')}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <LockIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id='settings-confirm-password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  placeholder={t('fields.passwordRepeatPlaceholder')}
                  aria-invalid={errors.confirmPassword ? true : undefined}
                  {...register('confirmPassword')}
                />
                <InputGroupAddon align='inline-end'>
                  <InputGroupButton
                    size='icon-xs'
                    aria-label={
                      showConfirmPassword
                        ? t('fields.hidePassword')
                        : t('fields.showPassword')
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
          </FieldGroup>
        </CardContent>
        <CardFooter className='justify-end mt-6'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon='inline-start' />}
            {isSubmitting
              ? t('changePassword.submitting')
              : t('changePassword.submit')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
