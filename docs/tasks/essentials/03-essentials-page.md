**Status:** not-started

## Goal

`/essentials` route — a table of all essentials with their amount, currency, linked category (with icon + color), and edit/delete actions. Footer shows the IDR-equivalent monthly total.

## Acceptance criteria

- [ ] `src/features/essentials/pages/essentials-list.tsx` renders a shadcn `Table` with columns: Name, Category, Amount, Notes, Actions.
- [ ] "Add essential" button in the page header opens `<EssentialForm mode="create" />` in a dialog.
- [ ] Row actions: Edit (opens form in edit mode), Delete (confirm dialog → `deleteEssential`).
- [ ] Footer summary uses the `MonthlyBaselineSummary` component from `04-monthly-baseline-summary.md` to render the IDR total.
- [ ] Route added to `src/features/essentials/routes.tsx` at `/essentials`, wrapped per the guard convention.
- [ ] Loading: `Skeleton` rows. Empty: prompt to add the first essential.

## Notes
