import { currencyFractionDigits, currencySymbol } from './currency-meta';
import type { CurrencyCode } from './fx';
import { activeLocale } from './locale';

/**
 * Format a money amount as `<symbol><grouped number>` — e.g. `Rp8.096.000`,
 * `$500.00`. The symbol and decimal count come from the static, ICU-free
 * `currency-meta` table (`Rp`/`$`/…, IDR→0 decimals), NOT from Intl's
 * `style: 'currency'`. Intl's currency style is unreliable on React
 * Native/Hermes (it renders the ISO code `IDR` instead of `Rp` under `en-US`
 * and drops IDR's zero-decimal rule), which is what made the same amount show as
 * both `Rp8.096.000,00` and `IDR 430,000.00` across screens. Only the digit
 * grouping/decimal separators still follow the locale.
 */
export function formatCurrency(
  amount: number,
  code: CurrencyCode,
  locale: string = activeLocale()
): string {
  const digits = currencyFractionDigits(code);
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currencySymbol(code)}${number}`;
}

/**
 * Number of fractional digits a currency conventionally uses, sourced from
 * CLDR via Intl. IDR/JPY/KRW/VND resolve to 0 (no sen/cents), USD/EUR/etc to 2.
 * This is what drives how many decimals the amount inputs accept, so what the
 * user types matches how `formatCurrency` later displays it.
 */
export function fractionDigitsForCurrency(
  code: CurrencyCode,
  locale: string = activeLocale()
): number {
  return (
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/**
 * Compact currency for tight spaces like chart axes, e.g. id-ID → `Rp 1,5 jt`.
 * Keeps the symbol so axes stay unambiguous without the long digit runs.
 */
export function formatCurrencyCompact(
  amount: number,
  code: CurrencyCode,
  locale: string = activeLocale()
): string {
  const number = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currencySymbol(code)}${number}`;
}

/**
 * The grouping and decimal separators for a locale, e.g. id-ID → `.` and `,`.
 * Used to configure thousands-grouped amount inputs.
 */
export function localeSeparators(locale: string = activeLocale()): {
  group: string;
  decimal: string;
} {
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1);
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  };
}
