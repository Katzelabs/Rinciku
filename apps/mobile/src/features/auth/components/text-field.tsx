import { type ReactNode, useState } from 'react';
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

import { Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';

export function FieldLabel({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <Text style={[styles.label, { color: c.foreground }]}>{children}</Text>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  const c = useTheme();
  if (!message) return null;
  return (
    <View style={styles.errorRow}>
      <Icon
        name='exclamationmark.triangle.fill'
        size={13}
        color={c.destructive}
      />
      <Text selectable style={[styles.error, { color: c.destructive }]}>
        {message}
      </Text>
    </View>
  );
}

/** Bordered input container shared by TextField and PasswordField. */
export function InputShell({
  invalid,
  focused,
  leading,
  children,
}: {
  invalid?: boolean;
  focused?: boolean;
  /** Optional leading icon/adornment rendered before the input. */
  leading?: ReactNode;
  children: ReactNode;
}) {
  const c = useTheme();
  const borderColor = invalid ? c.destructive : focused ? c.ring : c.input;
  return (
    <View
      style={[
        styles.inputShell,
        { backgroundColor: c.card, borderColor },
        focused && !invalid ? styles.focused : null,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      {children}
    </View>
  );
}

interface TextFieldProps<T extends FieldValues> extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'style'
> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  /** Optional leading icon/adornment rendered inside the input shell. */
  leading?: ReactNode;
  /** Show the field's own validation error below it (default true). */
  showError?: boolean;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  leading,
  showError = true,
  ...inputProps
}: TextFieldProps<T>) {
  const c = useTheme();
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
              leading={leading}
            >
              <TextInput
                style={[styles.input, { color: c.foreground }]}
                placeholderTextColor={c.mutedForeground}
                value={field.value == null ? '' : String(field.value)}
                onChangeText={field.onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  field.onBlur();
                }}
                {...inputProps}
              />
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
  label: { fontFamily: Fonts.medium, fontSize: 14 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  error: { fontFamily: Fonts.regular, fontSize: 13, flex: 1 },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth * 2,
    // Fully rounded (pill) to match the web Input — see button.tsx.
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    borderCurve: 'continuous',
  },
  focused: { boxShadow: Shadow.md },
  leading: { paddingRight: Spacing.half },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
});
