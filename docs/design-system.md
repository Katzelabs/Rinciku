# Design system

How Rinciku looks and why. **Read this before any UI work.** The token *values*
live in code (`apps/mobile/src/constants/theme.ts`; web mirrors them in
`apps/web/src/index.css`); this doc holds the *rules and rationale* so they don't
get reverted. Direction approved 2026-07; target bar is Wise / Copilot polish
while keeping the olive/lime identity.

## Table of contents

- [Principles](#principles) — the non-negotiables
- [Color](#color) — lime is an accent, not a fill
- [Surfaces](#surfaces) — elevation and ground
- [Typography](#typography) — hierarchy and numerals
- [Categories](#categories) — emoji chips + color coding
- [Currency](#currency) — one formatter, always
- [Layout](#layout) — spacing, radius, safe areas
- [Where it lives](#where-it-lives) — file map
- [Changelog](#changelog)

## Principles

1. **One hero number per screen, in ink.** The most important figure is rendered
   near-black (`foreground`), not colored. Authority reads as restraint.
2. **Spend boldness in one place.** Lime is the accent; everything around it is
   quiet. ~3 lime surfaces per screen, max.
3. **Color carries meaning.** Category hue, positive/negative money, and
   good/warn/critical state are all encoded in color — never decorative.
4. **Scannable, not readable.** Lists are scanned by color + shape before text.
5. **Honor the platform.** Native large-title headers, native tab bar, safe
   areas. Don't fight iOS/Android chrome.

## Color

- **`primary` (lime `#9AE600`) is an ACCENT, never a text fill.** Use it for
  CTAs, the active tab, small positive chips/deltas, and the chart endpoint.
  Giant numbers filled with lime read as "startup demo," not "trusted with
  money." This was the single biggest fix in the refresh.
- **Money color:** big totals use `foreground` (ink). Income and a healthy net
  use the **`positive`** token (light `#3F7A00`, dark `#A3E635`) — a legible
  green, *not* neon `primary`. Overspending / negative net uses `destructive`.
- **Neutrals are chosen, not defaulted** — warm, olive-biased (see Surfaces).
- Both light and dark are first-class. Never hardcode a hex in a component; read
  a theme token via `useTheme()` so both schemes work.

## Surfaces

- Light `background` is a warm paper (`#F2F2EA`), deliberately darker than the
  white `card` so cards read as raised objects. (The old `#FAFAF7` was ~1%
  contrast with white — cards dissolved.)
- The `Card` primitive carries a soft `Shadow.sm`. Pick **one** elevation
  language per surface — don't stack heavy border + heavy shadow. Shadows read on
  light and are effectively invisible on dark, where card/bg contrast does the
  work.

## Typography

- Figtree, via the `Type` scale in `theme.ts`. Never hand-pair `fontFamily` +
  `fontSize`; use `<AppText variant>` or spread `Type.<variant>`.
- **Tabular figures on all money.** Money-carrying `AppText` variants (`hero`,
  `amount`, `amountSmall`) apply `TabularNums` automatically so digits align in
  columns and don't jitter. Raw `Text` money styles must spread `TabularNums`.

## Categories

- **Glyph = emoji.** A category stores a lucide icon *name* (`icon` field,
  unchanged); apps render it as an emoji via `categoryEmoji(name)` in
  `@rinciku/domain/categories`. `CategoryIcon` renders the emoji — change it
  there, and rows/medallions/picker/selects all stay consistent.
- **Chip = rounded-square `CategoryBadge`** (`Radius.xl`), a soft tint of the
  category color behind the emoji. `TransactionRow` routes through it.
- **Never the gray tag.** A colorless category falls back to
  `categoryColorFor(seed)` — a deterministic vivid hue from `PRESET_COLORS`
  (domain). Seed on a stable id/name so the hue is stable per category.

## Currency

- **One formatter: `formatCurrency` (+ `formatCurrencyCompact`) in
  `packages/core/src/format.ts`.** It is **symbol-based** — `currencySymbol` +
  `currencyFractionDigits` from `currency-meta.ts`. Always the right symbol
  (`Rp`/`$`), IDR = 0 decimals, `-` before the symbol. Digit grouping follows the
  active locale.
- **Do NOT revert to `Intl` `style: 'currency'`.** On React Native/Hermes it
  renders the ISO code `IDR` instead of `Rp` and drops IDR's zero-decimal rule —
  that produced the `Rp8.096.000,00` vs `IDR 430,000.00` inconsistency.

## Layout

- Spacing / radius / border from `theme.ts` (`Spacing`, `Radius`, `Border`).
  Controls are pills (`Radius.pill`); cards/chips are `Radius.xl`/`2xl`.
- **Scroll screens must clear the tab bar.** `ScreenScroll` pads the bottom by
  `BottomTabInset` — use it (or the token) rather than a magic constant, or
  content bleeds under the translucent NativeTabs bar (was broken on Android).

## Where it lives

| Concern | File |
| --- | --- |
| Color / type / spacing / radius / shadow tokens | `apps/mobile/src/constants/theme.ts` |
| Web token mirror (OKLch) | `apps/web/src/index.css` |
| Money formatting | `packages/core/src/format.ts`, `currency-meta.ts` |
| Category emoji + color + presets | `packages/domain/src/features/categories/constants.ts` |
| Text / Card / Screen / Sheet / Button / Pill primitives | `apps/mobile/src/components/ui/` |
| Category chip / row | `apps/mobile/src/components/category-badge.tsx`, `transaction-row.tsx` |

## Changelog

- **2026-07 — Refresh foundation.** Lime demoted to accent; `positive` money
  token; warm ground + card shadow; tabular money figures; symbol-based currency
  formatter; emoji category chips (`categoryEmoji`) + deterministic
  `categoryColorFor` (no more gray); `BottomTabInset` wired into `ScreenScroll`;
  list subtitle de-dup.
- **2026-07 — Refresh follow-through.** Dashboard "safe-to-spend" hero + chart
  legend + top-categories bento; AI-chat composer polish. **Header icons unified
  to one vocabulary:** native header-button icons rasterize Material Design Icons
  via `apps/mobile/src/lib/header-icons.ts` (`headerIcon.*`) so they render and
  tint on both iOS + Android — replacing the iOS-only `type: 'sfSymbol'` items
  that were blank on Android. Add new header icons to that map, not inline.
  **Conversation-history rows** now carry a one-line last-message preview + a
  relative timestamp (`formatRelativeTime` in `@rinciku/core`, i18n
  count-plurals — not `Intl.RelativeTimeFormat`, which Hermes lacks) and a proper
  `EmptyState`. **Category icon picker:** decision recorded — it stays emoji
  (mapped from the stored lucide name via `categoryEmoji`); no pure-emoji model.
