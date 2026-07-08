# Rinciku Logo Assets

## Files

| File | Use |
|---|---|
| `mark.svg` | Standalone icon mark — use anywhere you need just the symbol (app icon base, loading states, avatars) |
| `favicon.svg` | Browser favicon — link in `<head>` as `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` |
| `logo-horizontal.svg` | Primary lockup — navbar, marketing, README header |
| `logo-stacked.svg` | Stacked lockup — splash screens, app store listings, square contexts |
| `logo-horizontal-dark.svg` | Dark background variant — dark mode navbar, dark hero sections |

## Colors

| Token | Hex | Use |
|---|---|---|
| Brand green (dark) | `#4a7a42` | Mark background (light mode) |
| Brand green (light) | `#5a9050` | Mark background (dark mode) |
| Wordmark dark | `#2e4e28` | Wordmark on light backgrounds |
| Wordmark light | `#d8eecc` | Wordmark on dark backgrounds |
| Tagline | `#8aaa80` | Tagline on light backgrounds |
| Tagline dark | `#5a8050` | Tagline on dark backgrounds |

## Usage in the app

In-app surfaces (sidebar header, auth pages, favicon) render the mark through a
**theme-aware** React component rather than these static SVGs, so the brand tracks
the app palette and flips automatically in dark mode:

```tsx
import { Logo, LogoMark } from '@/components/shared/logo'

<Logo />        // mark + wordmark lockup
<LogoMark />    // mark only
```

`LogoMark` draws the square with `--primary` and the lines with `--primary-foreground`.
The app's `--primary` is the theme **lime**, so the in-app mark and `public/favicon.svg`
are lime + dark green — they intentionally differ from the **forest-green** files in this
folder. The `logo/*.svg` files are the standalone brand assets (README headers, marketing,
app-store listings) and keep the forest-green palette below.

The favicon is already wired in `index.html`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```
