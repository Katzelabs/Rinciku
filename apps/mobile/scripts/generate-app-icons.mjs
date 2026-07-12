// Regenerates the full app icon + splash asset set from the Rinciku brand
// mark — the lowercase “r.” with a lime full stop on the warm dark ground.
//
// The mark geometry here is the single source of truth shared (scaled to a
// 100×100 viewBox) by the web LogoMark, the mobile LogoMark, and the landing
// Logo.astro / assets/logo/*.svg. If the mark changes, update those too.
//
// Usage (from apps/mobile):  node scripts/generate-app-icons.mjs
// Uses sharp from apps/landing (no extra dependency in this workspace).
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const require = createRequire(join(repoRoot, 'apps/landing/package.json'));
const sharp = require('sharp');

const OUT = join(repoRoot, 'apps/mobile/assets/images');

// Brand tokens (src/constants/theme.ts)
const CREAM = '#FBFBF9';
const INK = '#0C0C09';
const LIME = '#9AE600';

// The “r.” glyph in 1024-space
const glyph = (main, accent) => `
  <path d="M 420 700 V 480 Q 420 396 504 396 H 560" fill="none" stroke="${main}" stroke-width="104" stroke-linecap="round"/>
  <circle cx="668" cy="648" r="52" fill="${accent}"/>`;

// Monochrome silhouette (Android 13+ themed icon, iOS tinted)
const monoGlyph = (c) => glyph(c, c);

const ground = `
  <defs><radialGradient id="g" cx="50%" cy="38%" r="80%">
    <stop offset="0%" stop-color="#26261C"/><stop offset="100%" stop-color="#131310"/>
  </radialGradient></defs>
  <rect width="1024" height="1024" fill="url(#g)"/>`;

const svg = (inner, bg = '') =>
  `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${bg}${inner}</svg>`;

const render = (svgStr, size, name) =>
  sharp(Buffer.from(svgStr)).resize(size, size).png().toFile(join(OUT, name));

const fullIcon = svg(glyph(CREAM, LIME), ground);

// iOS: light (opaque), dark (glyph on transparent — the system supplies the
// dark ground), tinted (grayscale glyph)
await render(fullIcon, 1024, 'icon.png');
await render(fullIcon, 1024, 'ios-icon-light.png');
await render(svg(glyph(CREAM, LIME)), 1024, 'ios-icon-dark.png');
await render(svg(monoGlyph('#E8E8E3')), 1024, 'ios-icon-tinted.png');

// Android adaptive: foreground (transparent, glyph sits inside the ~66% safe
// zone), monochrome (white silhouette). Background is a solid color in app.json.
await render(svg(glyph(CREAM, LIME)), 512, 'android-icon-foreground.png');
await render(svg(monoGlyph('#FFFFFF')), 432, 'android-icon-monochrome.png');

// Splash: ink glyph for the light scheme, cream for dark (see app.json plugin)
await render(svg(glyph(INK, LIME)), 512, 'splash-icon.png');
await render(svg(glyph(CREAM, LIME)), 512, 'splash-icon-dark.png');

console.log('regenerated app icon set in', OUT);
