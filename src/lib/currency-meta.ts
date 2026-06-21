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
