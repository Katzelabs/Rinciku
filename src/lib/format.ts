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
