import type { CurrencyCode } from './fx';

const DEFAULT_LOCALE = 'id-ID';

export function formatCurrency(
  amount: number,
  code: CurrencyCode,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
  }).format(amount);
}

/**
 * Number of fractional digits a currency conventionally uses, sourced from
 * CLDR via Intl. IDR/JPY/KRW/VND resolve to 0 (no sen/cents), USD/EUR/etc to 2.
 * This is what drives how many decimals the amount inputs accept, so what the
 * user types matches how `formatCurrency` later displays it.
 */
export function fractionDigitsForCurrency(
  code: CurrencyCode,
  locale: string = DEFAULT_LOCALE
): number {
  return (
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/**
 * The grouping and decimal separators for a locale, e.g. id-ID → `.` and `,`.
 * Used to configure thousands-grouped amount inputs.
 */
export function localeSeparators(locale: string = DEFAULT_LOCALE): {
  group: string;
  decimal: string;
} {
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1);
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  };
}
