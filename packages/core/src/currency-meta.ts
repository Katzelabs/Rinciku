import type { CurrencyCode } from './fx';

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  IDR: 'Indonesian Rupiah',
  USD: 'US Dollar',
  EUR: 'Euro',
  JPY: 'Japanese Yen',
  GBP: 'British Pound',
  SGD: 'Singapore Dollar',
  MYR: 'Malaysian Ringgit',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CNY: 'Chinese Yuan',
  KRW: 'South Korean Won',
  HKD: 'Hong Kong Dollar',
  THB: 'Thai Baht',
  PHP: 'Philippine Peso',
  INR: 'Indian Rupee',
  VND: 'Vietnamese Dong',
};

// ISO 3166-1 alpha-2 region per currency, used to derive a flag emoji.
const CURRENCY_REGION: Record<CurrencyCode, string> = {
  IDR: 'ID',
  USD: 'US',
  EUR: 'EU',
  JPY: 'JP',
  GBP: 'GB',
  SGD: 'SG',
  MYR: 'MY',
  AUD: 'AU',
  CAD: 'CA',
  CNY: 'CN',
  KRW: 'KR',
  HKD: 'HK',
  THB: 'TH',
  PHP: 'PH',
  INR: 'IN',
  VND: 'VN',
};

const REGIONAL_INDICATOR_A = 0x1f1e6; // 🇦

/** Flag emoji for a currency, built from its region's regional-indicator pair. */
export function currencyFlag(code: CurrencyCode): string {
  const region = CURRENCY_REGION[code];
  return String.fromCodePoint(
    REGIONAL_INDICATOR_A + (region.charCodeAt(0) - 65),
    REGIONAL_INDICATOR_A + (region.charCodeAt(1) - 65)
  );
}

// Conventional short symbol per currency. Unlike flag emojis (regional-indicator
// pairs), these render on every platform — Android in particular does not draw
// flag emojis, so a flag shows as a "?" tofu box there. CNY/JPY are both "¥", so
// CNY is prefixed to disambiguate.
const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  IDR: 'Rp',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
  SGD: 'S$',
  MYR: 'RM',
  AUD: 'A$',
  CAD: 'C$',
  CNY: 'CN¥',
  KRW: '₩',
  HKD: 'HK$',
  THB: '฿',
  PHP: '₱',
  INR: '₹',
  VND: '₫',
};

/** Short, cross-platform currency symbol (e.g. IDR → `Rp`, USD → `$`). */
export function currencySymbol(code: CurrencyCode): string {
  return CURRENCY_SYMBOL[code];
}

// Currencies with no minor unit (no sen/cents), so amounts are whole numbers.
const ZERO_DECIMAL_CURRENCIES = new Set<CurrencyCode>([
  'IDR',
  'JPY',
  'KRW',
  'VND',
]);

/**
 * Fractional digits a currency uses, from a static table — 0 for IDR/JPY/KRW/VND,
 * 2 for the rest. Unlike `fractionDigitsForCurrency` (which reads CLDR via Intl),
 * this needs no ICU data, so it's safe on React Native/Hermes where Intl
 * currency support isn't guaranteed across platforms.
 */
export function currencyFractionDigits(code: CurrencyCode): number {
  return ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2;
}
