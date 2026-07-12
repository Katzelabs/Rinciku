# Rinciku Logo Assets

**This folder is the canonical source of the Rinciku brand mark.** Every other
surface — the mobile app icon set, the web `LogoMark`, the landing `Logo.astro`,
all favicons — is a copy/derivation of `mark.svg` and must match it exactly.

The brand mark is a lowercase **“r.”** — cream glyph with a lime full stop — on
the warm dark ground, inside a 25%-radius rounded square. The source geometry
lives in a 100×100 viewBox (see `mark.svg`).

## Changing the logo

Always change **this folder first**, then propagate outward. The order:

1. Update `mark.svg` (and the derived `favicon.svg` + lockup SVGs here).
2. Port the same geometry into the three app components (they inline it —
   see the list under **Usage in the app** below).
3. Regenerate the mobile icon/splash set:
   `node apps/mobile/scripts/generate-app-icons.mjs`
   (update the glyph constants in that script to match `mark.svg` first).
4. Copy `favicon.svg` over `apps/web/public/favicon.svg` and
   `apps/landing/public/favicon.svg`; regenerate the landing PNGs
   (`favicon-32`, `apple-touch-icon`, `icon-192/512`, `og.png`).

Never edit a downstream copy on its own — that reintroduces the drift this
setup exists to prevent.

## Files

| File | Use |
|---|---|
| `mark.svg` | Standalone icon mark — use anywhere you need just the symbol (app icon base, loading states, avatars) |
| `favicon.svg` | Browser favicon — link in `<head>` as `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` |
| `logo-horizontal.svg` | Primary lockup — navbar, marketing, README header |
| `logo-stacked.svg` | Stacked lockup — splash screens, app store listings, square contexts |
| `logo-horizontal-dark.svg` | Dark background variant — dark mode navbar, dark hero sections |

## Colors

Fixed brand values (from the app design tokens in
`apps/mobile/src/constants/theme.ts`) — the mark does **not** theme-flip; like
an app icon, it reads the same on light and dark grounds.

| Token | Hex | Use |
|---|---|---|
| Ground (gradient start) | `#26261C` | Mark background, radial gradient center |
| Ground (gradient end) | `#131310` | Mark background, radial gradient edge |
| Glyph cream | `#FBFBF9` | The “r” stroke |
| Lime accent | `#9AE600` | The full stop (the theme `primary`) |
| Wordmark ink | `#0C0C09` | Wordmark on light backgrounds |
| Wordmark cream | `#FBFBF9` | Wordmark on dark backgrounds |
| Tagline | `#6B6B5C` | Tagline on light backgrounds |
| Tagline dark | `#A6A695` | Tagline on dark backgrounds |

## Usage in the app

In-app surfaces render the mark through components that carry the same fixed
geometry and colors:

- Web: `Logo` / `LogoMark` in `apps/web/src/components/shared/logo.tsx`
- Mobile: `LogoMark` in `apps/mobile/src/components/logo-mark.tsx` (react-native-svg)
- Landing: `Logo.astro` in `apps/landing/src/components/`

```tsx
import { Logo, LogoMark } from '@/components/shared/logo'

<Logo />        // mark + wordmark lockup
<LogoMark />    // mark only
```

The mobile app icon set (`apps/mobile/assets/images/icon.png`,
`ios-icon-*.png`, `android-icon-*.png`, `splash-icon*.png`) is generated from
this mark; the iOS dark/tinted variants and the Android monochrome icon are the
bare glyph without the ground.

The favicon is already wired in `index.html`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```
