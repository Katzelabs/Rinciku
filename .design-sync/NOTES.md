# design-sync notes — Rinciku

Rinciku is an **app**, not a packaged design system, so this sync runs the
package shape in **custom-entry mode**. Read this before re-syncing.

## How the build is wired

- **Prep first, every run:** `node .design-sync/gen-entry.mjs`. It (1) runs
  `pnpm exec vite build` to get the compiled Tailwind CSS, (2) strips
  `@font-face` from it and writes `.design-sync/.cache/compiled.css`
  (`cfg.cssEntry`), (3) writes the curated esbuild entry
  `.design-sync/.cache/bundle-entry.tsx`. Both outputs are gitignored.
- **Then the converter:**
  ```
  node .ds-sync/package-build.mjs --config .design-sync/config.json \
    --node-modules ./node_modules --entry .design-sync/.cache/bundle-entry.tsx --out ./ds-bundle
  node .ds-sync/package-validate.mjs ./ds-bundle --no-render-check
  ```
- `cfg.componentSrcMap` is the authoritative component list (44 entries, one
  card per file, family-level). Regenerate it with `node .design-sync/gen-entry.mjs map`
  if components are added/removed, and update `config.json`.

## Why account-menu and app-shell are excluded

- `shared/account-menu.tsx` imports `@/lib/supabase`, which **throws at module
  load** when `VITE_SUPABASE_*` env is absent (and the converter defines
  `import.meta.env` without those keys). It also pulls the whole
  `@/features/auth` route graph.
- `shared/app-shell.tsx` imports from `account-menu`, so it drags in the same
  graph.
- Both are app chrome, not reusable DS primitives. They're listed in
  `EXCLUDE` in `gen-entry.mjs`. Re-including either requires neutralizing the
  supabase env throw (e.g. esbuild define) AND wrapping in router/auth providers
  to render.

## Fonts & CSS

- Brand font **Figtree Variable** ships via `cfg.extraFonts`
  (`node_modules/@fontsource-variable/figtree/index.css`). The vite-built CSS
  references it by absolute `/assets/...` url that won't resolve on disk, which
  is why `@font-face` is stripped from `compiled.css` and the font is sourced
  from the package instead.
- `compiled.css` carries the olive theme tokens + every Tailwind utility class
  the **components** use. It is frozen to what the app build scanned.

## Known warns (expected, not new)

- `[RENDER_SKIPPED]` on every validate — the render check is intentionally
  skipped (`--no-render-check`); no browser was installed this run.
- validate: "tokens: 1 missing, below threshold" — non-blocking.

## Preview scope this run

- **Floor cards for all 44 components.** No authored `.design-sync/previews/*.tsx`
  exist. The bundle, `.d.ts`, and `.prompt.md` are all real; only the picker
  thumbnails are minimal. The design agent builds on-brand regardless (real
  bundle + styles.css ship the olive theme + Figtree).

## Re-sync risks / watch-list

- **No visual verification was ever done.** Floor cards and (if authored later)
  rich previews have never been screenshot-checked. To author rich previews,
  install Playwright + Chromium, then run `package-capture.mjs` to grade.
- **`compiled.css` staleness:** if components start using utility classes that
  the app doesn't yet use anywhere, those classes won't be in `compiled.css`.
  Authored previews should prefer composing real components + inline styles for
  layout glue, not arbitrary utilities.
- **`import.meta.env` define:** the converter injects a fixed `import.meta.env`
  without `VITE_*` keys. Any newly-synced component that reads `VITE_*` at module
  top level will throw at bundle load — exclude it or guard the access.
- **Groups** are path-derived: `general` (ui/ primitives), `shared`, `data-table`.
  Cosmetic; change only via per-component doc category stubs if desired.
- Upload was the **incremental path** into a fresh project (one approval,
  full writes, no reconciliation deletes needed). Project is pinned in
  `config.json` (`projectId`). Future syncs fetch its `_ds_sync.json` anchor.
