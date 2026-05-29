---
name: ui-component
description: Build or refactor a visual React component for Rinciku using Tailwind v4 + shadcn/ui primitives. Enforces cn() usage, @/ imports, lucide icons, the olive/radix-rhea theme, and Rinciku's shared-vs-feature-local component placement.
---

# ui-component

## When to use

- The user asks to build, redesign, or fix a UI component — cards, lists, headers, navigation, layouts, empty states, charts, etc.
- The component is **presentational** (no form validation, no data fetching). For forms, use `new-form`; for data, use `new-api`.
- The user mentions Tailwind, shadcn, styling, or design intent.

## Steps

1. **Decide placement** — ask "is this used by more than one feature?":
   - **Yes (shared)** → `src/components/shared/<name>.tsx`
   - **No (feature-local)** → `src/features/<feature>/components/<name>.tsx`
2. **Reach for shadcn first** — before writing custom UI, check `src/components/ui/` for an existing primitive (button, card, input, label currently installed). If a needed primitive is missing, run `add-shadcn-ui` to install it.
3. **Write the component**:
   - Named export, PascalCase. Kebab-case filename.
   - Props typed inline or with a `type Props = { ... }` above the component.
   - Use `cn()` from `@/lib/utils` for any conditional or merged classes:
     ```tsx
     import { cn } from '@/lib/utils';

     <div className={cn('rounded-md p-4', isActive && 'bg-accent')} />
     ```
   - Import shadcn primitives from `@/components/ui/<name>`.
   - Import lucide icons from `lucide-react`.
   - Use `@/` alias for every cross-folder import.
4. **Styling**:
   - Tailwind v4 — design tokens live in `src/index.css` (CSS-first config). To add a new token, edit the `@theme` block there, don't create a `tailwind.config.*`.
   - Use semantic shadcn color tokens (`bg-card`, `text-muted-foreground`, `border-border`, `bg-accent`, etc.) — these honor the olive/radix-rhea palette and dark mode.
   - Spacing/radius scales: stick to Tailwind defaults + the shadcn token scale; don't sprinkle arbitrary values like `p-[13px]`.
5. **React rules**:
   - Trust the React Compiler — no `useMemo`/`useCallback` for perf.
   - Server-friendly: no `'use client'` directives (this is a SPA, no RSC).
6. Run `pnpm build` and `pnpm lint`.

## Conventions to enforce

- Conditional classes go through `cn()` — never manual string concatenation.
- Color and surface come from shadcn tokens, not hex literals or raw Tailwind colors (`bg-olive-500` is wrong; `bg-accent` is right).
- Icons come from `lucide-react` only.
- One component per file. Sub-components used only by the main component can live in the same file, but if they grow, split them out.
- Shared components live in `src/components/shared/`, never in `src/components/ui/` (that folder is shadcn-owned and gets overwritten by re-installs).
- No `tailwind.config.*` file should ever be created — Tailwind v4 config is CSS-first in `src/index.css`.

## Verification

- `pnpm build` succeeds.
- `pnpm lint` is clean.
- In `pnpm dev`, render the component in its target page and visually verify spacing, colors, and dark-mode behavior.
- Resize the viewport — confirm responsive behavior holds at sm/md/lg breakpoints.
