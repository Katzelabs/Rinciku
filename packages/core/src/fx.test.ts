import { describe, expect, it } from 'vitest';
import {
  CURRENCY_CODES,
  FX_STUB,
  convertToBase,
  getCurrentRates,
  getFxStatus,
} from './fx';

// In Node there is no window/localStorage, so the module hydrates to the
// frozen FX_STUB — these tests exercise the pivot math, not live rates.

describe('FX_STUB', () => {
  it('has a positive, finite rate for every supported currency', () => {
    for (const code of CURRENCY_CODES) {
      const rate = FX_STUB[code];
      expect(Number.isFinite(rate)).toBe(true);
      expect(rate).toBeGreaterThan(0);
    }
  });

  it('pins IDR (the pivot) to exactly 1', () => {
    expect(FX_STUB.IDR).toBe(1);
  });
});

describe('convertToBase', () => {
  it('converts foreign → IDR via the rate map', () => {
    const { amount_base, rate } = convertToBase(100, 'USD', 'IDR');
    expect(rate).toBe(FX_STUB.USD);
    expect(amount_base).toBe(100 * FX_STUB.USD);
  });

  it('converts IDR → foreign with the inverse rate', () => {
    const { amount_base, rate } = convertToBase(16200, 'IDR', 'USD');
    expect(rate).toBeCloseTo(1 / FX_STUB.USD, 10);
    expect(amount_base).toBe(1);
  });

  it('is the identity for same-currency conversion', () => {
    const { amount_base, rate } = convertToBase(1234.56, 'USD', 'USD');
    expect(rate).toBe(1);
    expect(amount_base).toBe(1234.56);
  });

  it('rounds the converted amount to 2 decimals', () => {
    // 10,000 IDR → USD = 0.61728…, must come back as 0.62
    const { amount_base } = convertToBase(10000, 'IDR', 'USD');
    expect(amount_base).toBe(0.62);
  });

  it('pivots cross-currency pairs through IDR', () => {
    const { rate } = convertToBase(1, 'USD', 'SGD');
    expect(rate).toBeCloseTo(FX_STUB.USD / FX_STUB.SGD, 10);
  });
});

describe('module state without a browser', () => {
  it('starts on the stub source', () => {
    expect(getFxStatus().source).toBe('stub');
    expect(getCurrentRates()).toEqual(FX_STUB);
  });
});
