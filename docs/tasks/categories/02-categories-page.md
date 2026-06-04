**Status:** done

## Goal

`/categories` route — three sectioned lists (Fixed / Needs / Wants) showing each category with its icon, color, and edit/delete actions. "Add category" button per section pre-selects the tier in the form.

## Acceptance criteria

- [x] `src/features/categories/pages/categories-list.tsx` renders three labeled groups using shadcn `Card` per section.
- [x] Each row shows the lucide icon (resolved from the stored icon name string), a color dot, and a row-level kebab menu (`DropdownMenu`) with Edit / Delete.
- [x] Delete shows a confirmation `Dialog` before calling `deleteCategory`.
- [x] Add buttons open the `CategoryForm` dialog from `03-category-form.md` with `defaultValues.tier` set.
- [x] Route added to `src/features/categories/routes.tsx` at path `/categories`, wrapped per the guard convention from `foundation/03-route-guards.md`.
- [x] Loading state via shadcn `Skeleton`; empty state nudges the user to add their first one.

## Notes

- File landed as `pages/categories.tsx` (not `pages/categories-list.tsx`) to keep the stub filename — the page component is exported as `CategoriesPage`. Route was already wired in `routes.tsx`/`router.tsx` via `protectedRoute()`, no change needed.
- Page-local fetch with a `refetchToken` + key-comparison pattern (matches `ExpensesPage`) instead of using `useCategories()` — the hook stays for cross-feature consumers like `ExpenseForm`.
- Two `Dialog` instances at page root: one for create/edit (renders `<CategoryForm>`), one for delete confirmation. Tier badge color is reused as an icon tint with `${color}22` (hex alpha) for the row background.
