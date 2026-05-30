**Status:** not-started

## Goal

`/expenses` route — table of expenses for the selected month with tier and category filters, plus add/edit/delete.

## Acceptance criteria

- [ ] `src/features/expenses/pages/expenses-list.tsx` renders a header with a month picker and tier filter, and a shadcn `Table` with columns: Date, Category (icon + name), Amount (original currency, secondary line shows IDR equivalent), Note, Actions.
- [ ] Month picker defaults to the current cycle (start day from `profiles.cycle_start_day`); changes refetch `listExpenses({ from, to })`.
- [ ] Tier filter is a multi-select pill group; applied client-side over the loaded month.
- [ ] "Add expense" button opens `<ExpenseForm mode="create" />` in a dialog.
- [ ] Row actions: Edit, Delete (confirm dialog).
- [ ] If a row has a linked attachment, show a paperclip icon that opens the attachment's signed URL in a new tab.
- [ ] Route added to `src/features/expenses/routes.tsx` at `/expenses`, wrapped per guard convention.
- [ ] Footer total: sum of IDR-equivalents for the visible (post-filter) rows.

## Notes
