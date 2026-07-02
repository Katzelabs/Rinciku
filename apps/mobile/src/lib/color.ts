/**
 * Append an alpha channel to a `#RRGGBB` hex. Returns the color unchanged if it
 * isn't a 6-digit hex (e.g. the dark-mode `rgba(...)` tokens), so it's safe to
 * call on any theme color. `alpha` is a 2-digit hex string — `'22'` ≈ 13%,
 * `'40'` = 25%. This is the single home for the `${color}22` tinting idiom that
 * was previously duplicated across the transaction/category/notice components.
 */
export function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex;
}
