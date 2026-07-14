import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatCurrencyCompact,
  fractionDigitsForCurrency,
  localeSeparators,
} from './format';

// Locale is passed explicitly everywhere so the tests don't depend on an
// initialized i18next instance (activeLocale() falls back to en-US without it).

describe('formatCurrency', () => {
  it('formats IDR with the Rp symbol and zero decimals', () => {
    expect(formatCurrency(8096000, 'IDR', 'id-ID')).toBe('Rp8.096.000');
    expect(formatCurrency(8096000, 'IDR', 'en-US')).toBe('Rp8,096,000');
  });

  it('never renders the ISO code (the Intl currency-style regression)', () => {
    expect(formatCurrency(430000, 'IDR', 'en-US')).not.toContain('IDR');
  });

  it('formats two-decimal currencies with cents', () => {
    expect(formatCurrency(500, 'USD', 'en-US')).toBe('$500.00');
    expect(formatCurrency(1234.5, 'USD', 'en-US')).toBe('$1,234.50');
    expect(formatCurrency(1234.5, 'EUR', 'id-ID')).toBe('€1.234,50');
  });

  it('drops fractional input for zero-decimal currencies by rounding', () => {
    expect(formatCurrency(1000.4, 'IDR', 'en-US')).toBe('Rp1,000');
    expect(formatCurrency(1000.5, 'JPY', 'en-US')).toBe('¥1,001');
  });

  it('puts the minus sign before the symbol', () => {
    expect(formatCurrency(-50000, 'IDR', 'id-ID')).toBe('-Rp50.000');
    expect(formatCurrency(-12.34, 'USD', 'en-US')).toBe('-$12.34');
  });

  it('formats zero without a sign', () => {
    expect(formatCurrency(0, 'IDR', 'en-US')).toBe('Rp0');
  });
});

describe('formatCurrencyCompact', () => {
  it('keeps the symbol and compacts the number', () => {
    expect(formatCurrencyCompact(1500000, 'IDR', 'en-US')).toBe('Rp1.5M');
  });

  it('keeps the sign on negative amounts', () => {
    expect(formatCurrencyCompact(-2000, 'USD', 'en-US')).toBe('-$2K');
  });

  it('uses locale compact notation for id-ID', () => {
    const result = formatCurrencyCompact(1500000, 'IDR', 'id-ID');
    expect(result.startsWith('Rp1,5')).toBe(true); // id-ID: "Rp1,5 jt"
    expect(result).toContain('jt');
  });
});

describe('fractionDigitsForCurrency', () => {
  it('resolves 0 for zero-decimal currencies via CLDR', () => {
    expect(fractionDigitsForCurrency('IDR', 'en-US')).toBe(0);
    expect(fractionDigitsForCurrency('JPY', 'en-US')).toBe(0);
  });

  it('resolves 2 for USD/EUR', () => {
    expect(fractionDigitsForCurrency('USD', 'en-US')).toBe(2);
    expect(fractionDigitsForCurrency('EUR', 'id-ID')).toBe(2);
  });
});

describe('localeSeparators', () => {
  it('returns , group / . decimal for en-US', () => {
    expect(localeSeparators('en-US')).toEqual({ group: ',', decimal: '.' });
  });

  it('returns . group / , decimal for id-ID', () => {
    expect(localeSeparators('id-ID')).toEqual({ group: '.', decimal: ',' });
  });
});
