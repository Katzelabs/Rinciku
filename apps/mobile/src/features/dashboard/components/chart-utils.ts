import { activeLocale, currencySymbol, type CurrencyCode } from '@rinciku/core';

// Localized magnitude suffixes. Indonesian uses rb (ribu), jt (juta), M
// (miliar); English uses K/M/B. Kept as a small hand-rolled table rather than
// Intl's `notation: 'compact'`, which Hermes doesn't render reliably on device
// (it falls back to the full number, and IDR's many zeros then clip off the
// left edge of the plot). Plain `Intl.NumberFormat` (no compact notation) IS
// reliable, so we use it only for the locale-correct decimal separator.
const SUFFIX = {
  en: { k: 'K', m: 'M', b: 'B' },
  id: { k: 'rb', m: 'jt', b: 'M' },
} as const;

// Short, guaranteed-narrow axis label for the chart Y axis — e.g. "$1.5M",
// "Rp 1,5 jt". The currency symbol comes from @rinciku/core's static table
// (reliably "Rp"/"$", unlike Intl `style:'currency'` which yields the ISO code
// "IDR" on Hermes); the magnitude unit follows the active language.
export function compactAxisAmount(value: number, base: CurrencyCode): string {
  const locale = activeLocale(); // 'id-ID' | 'en-US'
  const lang = locale.startsWith('id') ? 'id' : 'en';
  const s = SUFFIX[lang];
  const sym = currencySymbol(base);
  const abs = Math.abs(value);

  let n = value;
  let unit = '';
  if (abs >= 1_000_000_000) {
    n = value / 1_000_000_000;
    unit = s.b;
  } else if (abs >= 1_000_000) {
    n = value / 1_000_000;
    unit = s.m;
  } else if (abs >= 1_000) {
    n = value / 1_000;
    unit = s.k;
  }

  const num = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(n);
  // Indonesian puts a space before the unit ("Rp 12 jt"); English doesn't ("$12M").
  const sep = lang === 'id' && unit ? ' ' : '';
  return `${sym} ${num}${sep}${unit}`;
}
