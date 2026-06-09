import type { CurrencyCode } from './fx';

export function formatCurrency(
  amount: number,
  code: CurrencyCode,
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
  }).format(amount);
}

const ZERO_DECIMAL_CURRENCIES = new Set<CurrencyCode>(['JPY', 'KRW', 'VND']);

export function stepForCurrency(code: CurrencyCode): '1' | '0.01' {
  return ZERO_DECIMAL_CURRENCIES.has(code) ? '1' : '0.01';
}
