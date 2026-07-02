import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet } from 'react-native';

import { Button, Card, FieldError, PasswordField } from '@/components/ui';
import { updatePassword } from '@/features/auth/api';
import { PasswordRules } from '@/features/auth/components/password-rules';
import {
  makeChangePasswordSchema,
  type ChangePasswordInput,
} from '@/features/auth/schemas';
import { Spacing } from '@/constants/theme';

// Security page: change the account password with live rule validation.
// Extracted from the old settings screen.
export function ChangePasswordForm() {
  const { t } = useTranslation('auth');
  const schema = useMemo(() => makeChangePasswordSchema(t), [t]);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const passwordValue = useWatch({ control, name: 'password' }) ?? '';

  const onSubmit = handleSubmit(async ({ password }) => {
    clearErrors('root');
    const { error } = await updatePassword(password);
    if (error) {
      setError('root', { message: t('changePassword.error') });
      return;
    }
    reset({ password: '', confirmPassword: '' });
    Alert.alert(t('changePassword.updated'));
  });

  return (
    <Card style={styles.card}>
      <PasswordField
        control={control}
        name='password'
        label={t('fields.newPassword')}
        placeholder={t('fields.passwordMinPlaceholder')}
        autoComplete='new-password'
        showError={false}
      />
      <PasswordRules value={passwordValue} />
      {passwordValue.length === 0 ? (
        <FieldError message={errors.password?.message} />
      ) : null}
      <PasswordField
        control={control}
        name='confirmPassword'
        label={t('changePassword.confirmNewPassword')}
        placeholder={t('fields.passwordRepeatPlaceholder')}
        autoComplete='new-password'
      />
      <FieldError message={errors.root?.message} />
      <Button
        label={
          isSubmitting ? t('changePassword.submitting') : t('changePassword.submit')
        }
        loading={isSubmitting}
        onPress={onSubmit}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
});
