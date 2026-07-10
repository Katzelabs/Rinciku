// Generates raster favicons, app icons, and the 1200×630 OG card into public/.
// Run from the landing workspace: `node scripts/generate-assets.mjs`.
// Uses sharp (already a dependency for astro:assets image optimization).
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = resolve(__dirname, '../public');

const LIME = '#9ae600';
const FOREST = '#35530e';
const GROUND = '#fbfbf9';
const INK = '#252017';

// Full-bleed app icon (iOS rounds the corners itself, so no rounded rect here).
const appIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${LIME}"/>
  <rect x="5" y="8" width="22" height="5" rx="2.5" fill="${FOREST}" opacity="0.93"/>
  <rect x="5" y="16" width="15" height="5" rx="2.5" fill="${FOREST}" opacity="0.65"/>
  <rect x="5" y="24" width="9" height="5" rx="2.5" fill="${FOREST}" opacity="0.37"/>
</svg>`;

// favicon-32 keeps the rounded-square look (transparent corners).
const faviconRounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="${LIME}"/>
  <rect x="5" y="8" width="22" height="5" rx="2.5" fill="${FOREST}" opacity="0.93"/>
  <rect x="5" y="16" width="15" height="5" rx="2.5" fill="${FOREST}" opacity="0.65"/>
  <rect x="5" y="24" width="9" height="5" rx="2.5" fill="${FOREST}" opacity="0.37"/>
</svg>`;

// 1200×630 Open Graph card.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="85%" cy="110%" r="70%">
      <stop offset="0%" stop-color="${LIME}" stop-opacity="0.55"/>
      <stop offset="70%" stop-color="${LIME}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${GROUND}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- brand lockup -->
  <g transform="translate(80,74)">
    <rect width="56" height="56" rx="14" fill="${LIME}"/>
    <rect x="9" y="14" width="38" height="9" rx="4.5" fill="${FOREST}" opacity="0.93"/>
    <rect x="9" y="28" width="26" height="9" rx="4.5" fill="${FOREST}" opacity="0.65"/>
    <rect x="9" y="42" width="16" height="9" rx="4.5" fill="${FOREST}" opacity="0.37"/>
    <text x="74" y="38" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="${INK}">Rinciku</text>
  </g>

  <!-- headline -->
  <text x="80" y="300" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="800" fill="${INK}" letter-spacing="-2">Know if you can</text>
  <text x="80" y="384" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="800" fill="${INK}" letter-spacing="-2">afford it,</text>
  <g>
    <rect x="330" y="322" width="360" height="82" rx="14" fill="${LIME}"/>
    <text x="352" y="384" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="800" fill="${FOREST}" letter-spacing="-2">before you buy.</text>
  </g>

  <!-- subline -->
  <text x="82" y="470" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="500" fill="#6b6455">AI money companion for mixed IDR / USD income.</text>
  <text x="82" y="560" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="${INK}">rinciku.com</text>
</svg>`;

const jobs = [
  [appIcon, 'apple-touch-icon.png', 180],
  [appIcon, 'icon-192.png', 192],
  [appIcon, 'icon-512.png', 512],
  [faviconRounded, 'favicon-32.png', 32],
];

for (const [svg, name, size] of jobs) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(resolve(pub, name));
  console.log(`✓ ${name} (${size}×${size})`);
}

await sharp(Buffer.from(og)).png().toFile(resolve(pub, 'og.png'));
console.log('✓ og.png (1200×630)');
