// FX rate table is a frozen snapshot, NOT live. Replace with a live source in
// foundation/06-live-fx-source.md before launch. Values are approx mid-2026
// rates expressed as: how many IDR per 1 unit of the source currency.
// Snapshot date: 2026-06-09.

export const CURRENCY_CODES = [
  'IDR',
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'SGD',
  'MYR',
  'AUD',
  'CAD',
  'CNY',
  'KRW',
  'HKD',
  'THB',
  'PHP',
  'INR',
  'VND',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const RATES_TO_IDR: Record<CurrencyCode, number> = {
  IDR: 1,
  USD: 16200,
  EUR: 17500,
  JPY: 105,
  GBP: 20500,
  SGD: 12000,
  MYR: 3500,
  AUD: 10700,
  CAD: 11900,
  CNY: 2240,
  KRW: 11.8,
  HKD: 2080,
  THB: 460,
  PHP: 285,
  INR: 192,
  VND: 0.64,
};

export function convertToBase(
  amount: number,
  from: CurrencyCode,
  base: CurrencyCode
): { amount_base: number; rate: number } {
  const rate = RATES_TO_IDR[from] / RATES_TO_IDR[base];
  const amount_base = Math.round(amount * rate * 100) / 100;
  return { amount_base, rate };
}
