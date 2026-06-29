import { type ReactNode } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function FieldLabel({ children }: { children: ReactNode }) {
  const c = useTheme();
  return <Text style={[styles.label, { color: c.foreground }]}>{children}</Text>;
}

export function FieldError({ message }: { message?: string | null }) {
  const c = useTheme();
  if (!message) return null;
  return (
    <Text selectable style={[styles.error, { color: c.destructive }]}>
      {message}
    </Text>
  );
}

/** Bordered input container shared by TextField and PasswordField. */
export function InputShell({
  invalid,
  children,
}: {
  invalid?: boolean;
  children: ReactNode;
}) {
  const c = useTheme();
  return (
    <View
      style={[
        styles.inputShell,
        { backgroundColor: c.card, borderColor: invalid ? c.destructive : c.input },
      ]}
    >
      {children}
    </View>
  );
}

interface TextFieldProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'style'> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  /** Show the field's own validation error below it (default true). */
  showError?: boolean;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  showError = true,
  ...inputProps
}: TextFieldProps<T>) {
  const c = useTheme();
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
                value={field.value == null ? '' : String(field.value)}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                {...inputProps}
              />
            </InputShell>
            {showError ? <FieldError message={fieldState.error?.message} /> : null}
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  label: { fontFamily: Fonts.medium, fontSize: 14 },
  error: { fontFamily: Fonts.regular, fontSize: 13 },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    borderCurve: 'continuous',
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
});
