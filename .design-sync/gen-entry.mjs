// Prep for syncing Rinciku's component library (shadcn ui/ + shared/ composites)
// to claude.ai/design. This is an APP, not a packaged DS, so the converter runs
// in custom-entry mode:
//
//   * A curated esbuild entry re-exports only the wanted component files.
//     account-menu.tsx is excluded because it imports @/lib/supabase (throws at
//     module load with no env) and the whole @/features/auth route graph, which
//     would poison the IIFE for every component.
//   * cssEntry = the app's compiled Tailwind stylesheet (vite build output),
//     with @font-face stripped. It carries the olive theme tokens + every
//     utility class the components use. The brand font (Figtree Variable) ships
//     separately via cfg.extraFonts (the @fontsource-variable/figtree package),
//     because the vite css references it by absolute /assets/ url that won't
//     resolve on disk.
//
// Re-sync: just re-run `node .design-sync/gen-entry.mjs` (it rebuilds the app
// css and rewrites the entry). Outputs land in .design-sync/.cache/ (gitignored).
//
// Modes:
//   node .design-sync/gen-entry.mjs report   # PascalCase exports per file
//   node .design-sync/gen-entry.mjs map      # componentSrcMap JSON (config)
//   node .design-sync/gen-entry.mjs          # vite build + compiled.css + entry

import { execSync } from 'node:child_process';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
  copyFileSync,
  statSync,
} from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMP = join(ROOT, 'src/components');
const CACHE = join(ROOT, '.design-sync/.cache');

// Files excluded from the bundle entirely (poison the IIFE at load time).
const EXCLUDE = new Set([
  'shared/account-menu.tsx', // @/lib/supabase (throws at load) + @/features/auth graph
  'shared/app-shell.tsx', // imports account-menu (so same supabase/auth graph); app chrome, not a DS primitive
]);

// Filename-derived PascalCase name doesn't match the file's primary export.
const PRIMARY_OVERRIDE = {
  'ui/sonner.tsx': 'Toaster',
  'ui/chart.tsx': 'ChartContainer',
};

function listFiles() {
  const out = [];
  for (const group of ['ui', 'shared']) {
    const dir = join(COMP, group);
    for (const name of readdirSync(dir)) {
      const sub = join(dir, name);
      if (name.endsWith('.tsx')) out.push(`${group}/${name}`);
      else if (statSync(sub).isDirectory()) {
        for (const f of readdirSync(sub))
          if (f.endsWith('.tsx')) out.push(`${group}/${name}/${f}`);
      }
    }
  }
  return out.filter((f) => !EXCLUDE.has(f)).sort();
}

function exportsOf(abs) {
  const src = readFileSync(abs, 'utf8');
  const names = new Set();
  const reInline =
    /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+([A-Z][A-Za-z0-9]*)/g;
  const reList = /export\s*\{([^}]*)\}/g;
  let m;
  while ((m = reInline.exec(src))) names.add(m[1]);
  while ((m = reList.exec(src))) {
    for (let part of m[1].split(',')) {
      part = part.trim();
      if (!part) continue;
      const as = /\bas\s+([A-Za-z0-9_]+)$/.exec(part);
      const nm = as ? as[1] : part.split(/\s+/)[0];
      if (/^[A-Z][A-Za-z0-9]*$/.test(nm)) names.add(nm);
    }
  }
  return [...names].sort();
}

function pascalFromFile(rel) {
  const base = rel
    .split('/')
    .pop()
    .replace(/\.tsx$/, '');
  return base
    .split('-')
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('');
}

// Primary (card-level) component name per file.
function primaryOf(rel) {
  if (PRIMARY_OVERRIDE[rel]) return PRIMARY_OVERRIDE[rel];
  const exports = exportsOf(join(COMP, rel));
  const guess = pascalFromFile(rel);
  return exports.includes(guess) ? guess : exports[0];
}

function buildMap() {
  const map = {};
  for (const rel of listFiles()) {
    const name = primaryOf(rel);
    if (!name) {
      console.error(`! no PascalCase export in ${rel}`);
      continue;
    }
    map[name] = `src/components/${rel}`;
  }
  return map;
}

const mode = process.argv[2];

if (mode === 'report') {
  for (const rel of listFiles())
    console.log(`${rel}\n  ${exportsOf(join(COMP, rel)).join(', ')}`);
  process.exit(0);
}

if (mode === 'map') {
  console.log(JSON.stringify(buildMap(), null, 2));
  process.exit(0);
}

// Default: full prep.
mkdirSync(CACHE, { recursive: true });

// 1. Build the app so Tailwind compiles every utility class the components use.
console.error('» vite build (for compiled Tailwind css)…');
execSync('pnpm exec vite build', {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, COREPACK_ENABLE_STRICT: '0' },
});

// 2. Pick the largest dist css, strip @font-face, write a stable compiled.css.
const assets = join(ROOT, 'dist/assets');
const cssFiles = readdirSync(assets)
  .filter((f) => f.endsWith('.css'))
  .map((f) => join(assets, f));
if (!cssFiles.length) {
  console.error('! no css emitted by vite build');
  process.exit(1);
}
const biggest = cssFiles.sort((a, b) => statSync(b).size - statSync(a).size)[0];
const css = readFileSync(biggest, 'utf8').replace(
  /@font-face\s*\{[^}]*\}/g,
  ''
);
const compiled = join(CACHE, 'compiled.css');
writeFileSync(compiled, css);
console.error(
  `  compiled.css ← ${relative(ROOT, biggest)} (@font-face stripped)`
);

// 3. Write the curated bundle entry (absolute paths; @/ imports inside the files
//    resolve via the converter's tsconfig-paths plugin).
const files = listFiles();
const entry = join(CACHE, 'bundle-entry.tsx');
writeFileSync(
  entry,
  files
    .map((rel) => `export * from ${JSON.stringify(join(COMP, rel))};`)
    .join('\n') + '\n'
);
console.error(
  `  bundle-entry.tsx ← ${files.length} files (account-menu excluded)`
);
console.error(
  'done. run the converter with --entry .design-sync/.cache/bundle-entry.tsx'
);
