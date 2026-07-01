import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { useTranslation } from 'react-i18next';

import {
  currencyFractionDigits,
  currencySymbol,
  type CurrencyCode,
} from '@rinciku/core';

import { Fonts, Spacing } from '@/constants/theme';
import { InputShell } from '@/features/auth/components/text-field';
import { useTheme } from '@/hooks/use-theme';

// Grouping/decimal separators per UI language. Derived here (not via Intl) so
// formatting is identical on every platform — Hermes doesn't guarantee ICU
// currency/locale data. Indonesian groups with "." and uses "," for decimals;
// English is the reverse.
function separatorsFor(language: string): { group: string; decimal: string } {
  return language.startsWith('id')
    ? { group: '.', decimal: ',' }
    : { group: ',', decimal: '.' };
}

interface CurrencyAmountInputProps {
  /** Currency code shown in the addon and used to decide decimal places. */
  currency: CurrencyCode;
  /** Numeric value, or `undefined` when the field is empty. */
  value: number | undefined;
  /** Called with the parsed number, or `undefined` when cleared. */
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  invalid?: boolean;
  placeholder?: string;
}

// Parse a user-typed string into the canonical digits[.digits] form, capping the
// fraction to `decimals`. The group separator and stray characters are dropped;
// the "other" separator ('.' or ',' that isn't the group char) starts the
// fraction — so both id (1.000,50) and en (1,000.50) grouped input parse right.
function sanitize(input: string, decimals: number, group: string): string {
  let intPart = '';
  let fracPart = '';
  let inFraction = false;
  for (const ch of input) {
    if (ch >= '0' && ch <= '9') {
      if (inFraction) fracPart += ch;
      else intPart += ch;
    } else if (ch === group) {
      // grouping separator — ignore
    } else if (decimals > 0 && !inFraction && (ch === '.' || ch === ',')) {
      inFraction = true;
    }
    // everything else is ignored
  }
  if (!inFraction) return intPart;
  return `${intPart}.${fracPart.slice(0, decimals)}`;
}

// Group the integer part and swap in the locale separators for display.
function toDisplay(canonical: string, group: string, decimal: string): string {
  if (canonical === '') return '';
  const [intRaw, fracRaw] = canonical.split('.');
  let intPart = intRaw.replace(/^0+(?=\d)/, '');
  if (intPart === '') intPart = '0';
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return canonical.includes('.') ? `${grouped}${decimal}${fracRaw}` : grouped;
}

function toNumber(canonical: string): number | undefined {
  if (canonical === '' || canonical === '.') return undefined;
  const n = Number(canonical);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Money input with live thousands grouping (e.g. `1.000.000`) so large amounts
 * stay readable as they're typed. Decimal places follow the currency (0 for
 * IDR/JPY/KRW/VND, 2 for USD/EUR/…); grouping/decimal separators follow the UI
 * locale. Renders inside the shared pill InputShell with the currency symbol as
 * a leading addon. The RN counterpart to the web CurrencyAmountInput.
 */
export function CurrencyAmountInput({
  currency,
  value,
  onChange,
  onBlur,
  invalid,
  placeholder,
}: CurrencyAmountInputProps) {
  const c = useTheme();
  const { i18n } = useTranslation();
  const [focused, setFocused] = useState(false);
  const decimals = currencyFractionDigits(currency);
  const { group, decimal } = separatorsFor(i18n.resolvedLanguage ?? 'en');

  const [text, setText] = useState(() =>
    value == null ? '' : toDisplay(String(value), group, decimal)
  );

  // While the user isn't editing, mirror the external value (form reset/default,
  // currency or language switch that changes separators/decimals). Adjusting
  // state during render — guarded by an equality check — is React's recommended
  // alternative to a syncing effect, and avoids clobbering an in-progress entry
  // (like a trailing decimal point) while the field is focused.
  if (!focused) {
    const wanted =
      value == null ? '' : toDisplay(String(value), group, decimal);
    if (wanted !== text) setText(wanted);
  }

  function handleChangeText(input: string) {
    const canonical = sanitize(input, decimals, group);
    setText(toDisplay(canonical, group, decimal));
    onChange(toNumber(canonical));
  }

  return (
    <InputShell
      invalid={invalid}
      focused={focused}
      leading={
        <Text style={[styles.symbol, { color: c.mutedForeground }]}>
          {currencySymbol(currency)}
        </Text>
      }
    >
      <TextInput
        style={[styles.input, { color: c.foreground }]}
        placeholderTextColor={c.mutedForeground}
        keyboardType={decimals === 0 ? 'number-pad' : 'decimal-pad'}
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        onChangeText={handleChangeText}
        placeholder={placeholder ?? (decimals === 0 ? '0' : '0.00')}
      />
    </InputShell>
  );
}

const styles = StyleSheet.create({
  symbol: { fontFamily: Fonts.semibold, fontSize: 15, minWidth: 24 },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
});
