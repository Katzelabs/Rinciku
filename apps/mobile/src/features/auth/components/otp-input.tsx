import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired once all OTP_LENGTH digits are entered (e.g. auto-submit). */
  onComplete?: (value: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
}

// Six-digit code entry backed by a single hidden TextInput (so paste and the
// iOS one-time-code autofill work), with the digits rendered as individual
// cells. Tapping anywhere refocuses the input. Numeric-only.
export function OtpInput({
  value,
  onChange,
  onComplete,
  invalid,
  autoFocus,
}: OtpInputProps) {
  const c = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  function handleChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    onChange(digits);
    if (digits.length === OTP_LENGTH) onComplete?.(digits);
  }

  const cells = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  return (
    <Pressable
      style={styles.row}
      onPress={() => inputRef.current?.focus()}
      accessibilityRole='none'
    >
      {cells.map((digit, i) => {
        const active = focused && i === Math.min(value.length, OTP_LENGTH - 1);
        const borderColor = invalid ? c.destructive : active ? c.ring : c.input;
        return (
          <View
            key={i}
            style={[
              styles.cell,
              { backgroundColor: c.card, borderColor },
              active && !invalid ? styles.active : null,
            ]}
          >
            <Text style={[styles.digit, { color: c.foreground }]}>{digit}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType='number-pad'
        textContentType='oneTimeCode'
        autoComplete='sms-otp'
        maxLength={OTP_LENGTH}
        autoFocus={autoFocus}
        // Kept in the layout (not display:none) so autofill/paste target it,
        // but visually collapsed behind the cells.
        style={styles.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'center' },
  cell: {
    flex: 1,
    maxWidth: 52,
    height: 56,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { boxShadow: Shadow.md },
  digit: { fontFamily: Fonts.semibold, fontSize: 22 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
