import { useState } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FieldError, FieldLabel, InputShell } from './text-field';

interface PasswordFieldProps<T extends FieldValues>
  extends Omit<
    TextInputProps,
    'value' | 'onChangeText' | 'onBlur' | 'style' | 'secureTextEntry'
  > {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  /** Show the field's own validation error below it (default true). */
  showError?: boolean;
}

export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  showError = true,
  ...inputProps
}: PasswordFieldProps<T>) {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <>
            <InputShell invalid={!!fieldState.error}>
              <TextInput
                style={[styles.input, { color: c.foreground }]}
                placeholderTextColor={c.mutedForeground}
                secureTextEntry={!visible}
                autoCapitalize='none'
                value={field.value == null ? '' : String(field.value)}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                {...inputProps}
              />
              <Pressable
                hitSlop={8}
                accessibilityRole='button'
                accessibilityLabel={
                  visible ? t('fields.hidePassword') : t('fields.showPassword')
                }
                onPress={() => setVisible((v) => !v)}
              >
                <Text style={[styles.toggle, { color: c.mutedForeground }]}>
                  {visible ? t('fields.hidePassword') : t('fields.showPassword')}
                </Text>
              </Pressable>
            </InputShell>
            {showError ? (
              <FieldError message={fieldState.error?.message} />
            ) : null}
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
  toggle: { fontFamily: Fonts.medium, fontSize: 13 },
});
