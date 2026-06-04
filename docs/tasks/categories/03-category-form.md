**Status:** done

## Goal

Reusable create/edit dialog form for a single category, used by the list page.

## Acceptance criteria

- [x] Zod schema `categorySchema` in `src/features/categories/schemas.ts`: `name` (non-empty), `tier` (`'fixed' | 'needs' | 'wants'`), `icon` (non-empty lucide name string), `color` (hex `#RRGGBB`).
- [x] `src/features/categories/components/category-form.tsx` exposes `<CategoryForm mode="create" | "edit" defaultValues onSuccess />`.
- [x] Built via the `new-form` skill (react-hook-form + shadcn `Form`).
- [x] Icon field is a searchable picker over a curated subset of lucide names (don't render the entire icon set — pick ~30 finance-relevant ones).
- [x] Color field is a small swatch picker over ~10 preset hex values plus a manual hex input.
- [x] Submit calls `createCategory` or `updateCategory` from `api.ts`; surfaces error via toast; calls `onSuccess` on success.

## Notes

- Curated icon list lives in `src/features/categories/lib/icons.ts` (30 finance icons). `CategoryIcon` is a stable wrapper that renders a lucide icon by name; used both in the picker and the list-row to satisfy the `static-components` lint rule.
- Preset color palette in `src/features/categories/lib/colors.ts` (10 muted swatches consistent with the olive theme and the seeded defaults).
- The form is bare (no Dialog chrome) — the list page owns the `Dialog`. The icon picker is a popover grid; not a typeahead, since the curated list is short.
