**Status:** not-started

## Goal

`/categories` route — three sectioned lists (Fixed / Needs / Wants) showing each category with its icon, color, and edit/delete actions. "Add category" button per section pre-selects the tier in the form.

## Acceptance criteria

- [ ] `src/features/categories/pages/categories-list.tsx` renders three labeled groups using shadcn `Card` per section.
- [ ] Each row shows the lucide icon (resolved from the stored icon name string), a color dot, and a row-level kebab menu (`DropdownMenu`) with Edit / Delete.
- [ ] Delete shows a confirmation `Dialog` before calling `deleteCategory`.
- [ ] Add buttons open the `CategoryForm` dialog from `03-category-form.md` with `defaultValues.tier` set.
- [ ] Route added to `src/features/categories/routes.tsx` at path `/categories`, wrapped per the guard convention from `foundation/03-route-guards.md`.
- [ ] Loading state via shadcn `Skeleton`; empty state nudges the user to add their first one.

## Notes
