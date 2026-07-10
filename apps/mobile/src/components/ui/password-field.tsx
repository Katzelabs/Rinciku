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
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Fonts, Spacing } from '@/constants/theme';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { FieldError, FieldLabel, InputShell } from './text-field';

interface PasswordFieldProps<T extends FieldValues> extends Omit<
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
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <>
            <InputShell
              invalid={!!fieldState.error}
              focused={focused}
              leading={<Icon name='lock' size={18} />}
            >
              <TextInput
                style={[styles.input, { color: c.foreground }]}
                placeholderTextColor={c.mutedForeground}
                secureTextEntry={!visible}
                autoCapitalize='none'
                value={field.value == null ? '' : String(field.value)}
                onChangeText={field.onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  field.onBlur();
                }}
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
                <Icon name={visible ? 'eye.slash' : 'eye'} size={20} />
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
});
