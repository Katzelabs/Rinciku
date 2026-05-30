**Status:** not-started

## Goal

Reusable create/edit dialog form for a single category, used by the list page.

## Acceptance criteria

- [ ] Zod schema `categorySchema` in `src/features/categories/schemas.ts`: `name` (non-empty), `tier` (`'fixed' | 'needs' | 'wants'`), `icon` (non-empty lucide name string), `color` (hex `#RRGGBB`).
- [ ] `src/features/categories/components/category-form.tsx` exposes `<CategoryForm mode="create" | "edit" defaultValues onSuccess />`.
- [ ] Built via the `new-form` skill (react-hook-form + shadcn `Form`).
- [ ] Icon field is a searchable picker over a curated subset of lucide names (don't render the entire icon set — pick ~30 finance-relevant ones).
- [ ] Color field is a small swatch picker over ~10 preset hex values plus a manual hex input.
- [ ] Submit calls `createCategory` or `updateCategory` from `api.ts`; surfaces error via toast; calls `onSuccess` on success.

## Notes
