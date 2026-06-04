**Status:** done

## Goal

`/expenses` route — table of expenses for the selected month with tier and category filters, plus add/edit/delete.

## Acceptance criteria

- [x] `src/features/expenses/pages/expenses.tsx` renders a header with a month picker and tier filter, and a shadcn `Table` with columns: Date, Category (icon + name), Amount (original currency, secondary line shows IDR equivalent), Note, Actions.
- [x] Month picker defaults to the current cycle (start day from `profiles.month_start_day`); changes refetch `listExpenses({ from, to })`.
- [x] Tier filter is a multi-select pill group; applied client-side over the loaded month.
- [x] "Add expense" button opens `<ExpenseForm mode="create" />` in a dialog.
- [x] Row actions: Edit, Delete (confirm dialog).
- [x] If a row has a linked attachment, show a paperclip icon that opens the attachment's signed URL in a new tab.
- [x] Route added to `src/features/expenses/routes.tsx` at `/expenses`, wrapped per guard convention.
- [x] Footer total: sum of IDR-equivalents for the visible (post-filter) rows.

## Notes

- 2026-06-03 — Implemented. New files: `src/features/expenses/lib/cycle.ts`, `components/expense-filters.tsx`, `components/expense-table.tsx`. `pages/expenses.tsx` replaced the temporary form scaffold with a full orchestrator.
- 2026-06-03 — Deviations from this task spec:
  - Filename is `expenses.tsx`, not `expenses-list.tsx` — kept the existing path that `routes.tsx` already imports.
  - Profile field is `month_start_day` (matches `docs/schema.md` §3 and `Profile` type), not `cycle_start_day` as named in the spec.
  - Category "icon" is rendered as a small colored circle with `category.color` + the first letter of the name. The `category.icon` column stores a lucide icon name; runtime lucide lookup is deferred (lucide-react@^1.x doesn't expose a clean dynamic resolver). Left a visual marker so the column still reads well.
  - If the tier filter has no pills selected, the table falls back to "show all" instead of going empty — surprising emptiness is worse than the strict reading.
  - Rows whose category was deleted (`category_id` set null via `on delete set null`) stay visible regardless of tier filter and render as "Uncategorized".
  - The list page also drives a fresh fetch after add/edit/delete via a bumped `refetchToken` rather than maintaining optimistic local state — keeps the page in lock-step with the DB after `ExpenseForm` succeeds.
- 2026-06-03 — `getAttachmentSignedUrl` was added to `src/features/expenses/api.ts` to unblock the paperclip column. The full upload flow (`uploadAttachment`, `createAttachment`, `updateAttachment`, `deleteAttachmentObject`) landed alongside as task 05.
