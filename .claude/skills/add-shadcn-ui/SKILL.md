---
name: add-shadcn-ui
description: Install one or more shadcn/ui primitives into Rinciku via the shadcn CLI, respecting components.json (radix-rhea style, olive base color, lucide icons). New components land in src/components/ui/.
---

# add-shadcn-ui

## When to use

- The user asks to add a shadcn component (dialog, dropdown menu, form, select, sheet, tabs, toast, etc.).
- `new-form` needs the `form` primitive but `src/components/ui/form.tsx` doesn't exist yet.
- `ui-component` needs a primitive (e.g. `card`, `badge`) that isn't installed.

## Steps

1. **Check before installing** — list current primitives:
   ```bash
   ls src/components/ui/
   ```
   Skip any that already exist. shadcn CLI will prompt to overwrite, which we don't want.
2. **Install** with the project's package manager (pnpm) — never `npx`:
   ```bash
   pnpm dlx shadcn@latest add <component> [<component> ...]
   ```
   Example: `pnpm dlx shadcn@latest add dialog dropdown-menu form`
3. **Verify** the files landed in `src/components/ui/` and imports use `@/components/ui/...` and `@/lib/utils`.
4. **Common companion installs** — some shadcn components have implicit dependencies that the CLI resolves automatically, but double-check the diff. If a component pulls in a peer (e.g. `form` brings nothing extra, but `data-table` would pull `table`), the CLI handles it.
5. If the user is installing a primitive to support `new-form`, hand back control to that skill once done.

## Conventions to enforce

- Always use `pnpm dlx shadcn@latest add ...`. Never `npx`, never a pinned older version.
- Never edit `components.json` to change `style`, `baseColor`, or `iconLibrary` mid-project — those are committed decisions (`radix-rhea`, `olive`, `lucide`).
- Files in `src/components/ui/` are considered shadcn-owned. If you need to customize behavior beyond what variants/classNames provide, wrap the primitive in a component under `src/components/shared/` or the feature's `components/` — don't edit the primitive in place (re-install will clobber it).
- If a primitive needs a small tweak (e.g. default variant), prefer setting it at call sites via the existing `variant` / `size` / `className` props.

## Verification

- `ls src/components/ui/` shows the new file(s).
- The new file imports `@/lib/utils` and (if applicable) `@/components/ui/...` — no relative paths.
- `pnpm build` succeeds.
- Render the primitive once in a page (or Storybook-equivalent — currently we don't have one, so just import it in a page) to confirm it's usable.
