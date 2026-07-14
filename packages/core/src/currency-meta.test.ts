import { describe, expect, it } from 'vitest';
import {
  CURRENCY_NAMES,
  currencyFlag,
  currencyFractionDigits,
  currencySymbol,
} from './currency-meta';
import { CURRENCY_CODES } from './fx';

describe('currencySymbol', () => {
  it('uses cross-platform symbols, not ISO codes', () => {
    expect(currencySymbol('IDR')).toBe('Rp');
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('VND')).toBe('₫');
  });

  it('disambiguates CNY from JPY (both ¥)', () => {
    expect(currencySymbol('JPY')).toBe('¥');
    expect(currencySymbol('CNY')).toBe('CN¥');
    expect(currencySymbol('CNY')).not.toBe(currencySymbol('JPY'));
  });

  it('has a symbol for every supported currency', () => {
    for (const code of CURRENCY_CODES) {
      expect(currencySymbol(code)).toBeTruthy();
    }
  });
});

describe('currencyFractionDigits', () => {
  it('is 0 for currencies without a minor unit', () => {
    for (const code of ['IDR', 'JPY', 'KRW', 'VND'] as const) {
      expect(currencyFractionDigits(code)).toBe(0);
    }
  });

  it('is 2 for everything else', () => {
    for (const code of CURRENCY_CODES) {
      if (['IDR', 'JPY', 'KRW', 'VND'].includes(code)) continue;
      expect(currencyFractionDigits(code)).toBe(2);
    }
  });
});

describe('currencyFlag', () => {
  it('builds regional-indicator flags', () => {
    expect(currencyFlag('IDR')).toBe('🇮🇩');
    expect(currencyFlag('USD')).toBe('🇺🇸');
    expect(currencyFlag('EUR')).toBe('🇪🇺');
  });
});

describe('currency tables', () => {
  it('name every supported currency', () => {
    for (const code of CURRENCY_CODES) {
      expect(CURRENCY_NAMES[code]).toBeTruthy();
    }
  });
});
