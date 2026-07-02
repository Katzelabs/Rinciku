import { activeLocale, type CurrencyCode } from '@rinciku/core';

// Short, guaranteed-narrow axis label for the chart Y axis — e.g. "Rp 1.5M",
// "$2K". Uses K/M/B magnitude suffixes rather than Intl's `notation: 'compact'`,
// which Hermes doesn't render reliably on device (it falls back to the full
// number, and IDR's many zeros then clip off the left edge of the plot).
export function compactAxisAmount(value: number, base: CurrencyCode): string {
  const sym = currencySymbol(base);
  const abs = Math.abs(value);

  let n = value;
  let suffix = '';
  if (abs >= 1_000_000_000) {
    n = value / 1_000_000_000;
    suffix = 'B';
  } else if (abs >= 1_000_000) {
    n = value / 1_000_000;
    suffix = 'M';
  } else if (abs >= 1_000) {
    n = value / 1_000;
    suffix = 'K';
  }

  const num = suffix ? trimDecimal(Math.round(n * 10) / 10) : String(Math.round(n));
  return `${sym} ${num}${suffix}`;
}

// 1.0 -> "1", 1.5 -> "1.5" (drops the trailing .0 so labels stay compact).
function trimDecimal(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// The bare currency symbol (e.g. "Rp", "$") for the active locale. Cached per
// locale+currency since it's derived on every gridline. Intl.NumberFormat +
// formatToParts is supported on Hermes; the try/catch guards older engines.
const symbolCache = new Map<string, string>();
function currencySymbol(base: CurrencyCode): string {
  const locale = activeLocale();
  const key = `${locale}:${base}`;
  const cached = symbolCache.get(key);
  if (cached !== undefined) return cached;

  let sym: string;
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: base,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    sym = parts.find((p) => p.type === 'currency')?.value ?? base;
  } catch {
    sym = base;
  }
  symbolCache.set(key, sym);
  return sym;
}
