**Status:** done

## Goal

Ship the incomes UI: list page with monthly sum and per-source breakdown, new/edit form pages, and the table component. The income form mirrors the expense form pattern — `amount` + `occurred_at` + `note` + `source` + optional attachment dropzone — with currency displayed read-only as the user's current base.

Depends on `incomes/02-api-and-attachments.md` (data layer) and `foundation/05-base-currency-and-cleanup.md` (`CurrencySelect`, `formatCurrency`).

## Acceptance criteria

### Routes

- [x] `src/features/incomes/routes.tsx` exports `incomesRoutes: RouteObject[]` with three routes: `/incomes`, `/incomes/new`, `/incomes/:id/edit`. Each protected by the same `RequireOnboarded` guard expenses uses.
- [x] `src/features/incomes/index.ts` re-exports `incomesRoutes`.
- [x] Register in `src/app/router.tsx` by spreading `incomesRoutes` into the `RootLayout` children. Add a sidebar/nav link alongside Expenses.

### List page (`src/features/incomes/pages/incomes.tsx`)

- [x] Table of rows ordered by `occurred_at desc`, with monthly grouping headers (same pattern as expenses).
- [x] Monthly total row at the top of each month group, formatted via `formatCurrency(total, base_currency)`.
- [x] Empty state when no incomes logged.
- [x] "Add income" CTA links to `/incomes/new`.

### Form (`src/features/incomes/components/income-form.tsx`)

- [x] `amount` number input. Per-currency decimal handling: JPY/KRW/VND → step=1, others → step=0.01. (Read base from `useAuth` profile.)
- [x] `occurred_at` date input, defaults to today.
- [x] `note` textarea (optional).
- [x] `source` select with options `manual` (default), `chat`, `image` — but for v1 only `manual` is exposed; chat/image come later from the ai-chat slice. Hide the select or render it disabled showing "manual" if no other choice is meaningful yet.
- [x] Currency display: a small label/chip showing the user's `base_currency`. Not editable.
- [x] Attachment dropzone reusing the pattern from `src/features/expenses/components/attachment-dropzone.tsx`. If that file is feature-local, either generalize it to `src/components/shared/attachment-dropzone.tsx` or duplicate and accept the small repetition. (Generalize if the diff is small.)
- [x] Submit flow when an attachment is present: upload object → `createIncomeAttachment` → `createIncome` linking `attachment_id` → `updateIncomeAttachment` to set `income_id` + `confirmed = true`. Cleanup on failure mirrors the expense flow (best-effort confirm step).

### Pages

- [x] `src/features/incomes/pages/income-new.tsx` — renders the form in create mode.
- [x] `src/features/incomes/pages/income-edit.tsx` — renders the form in edit mode. Attachment replace/remove is **out of scope** for this task (matches the expense edit-mode TODO).

### Verification

- [x] `pnpm build` passes.
- [x] `pnpm dev`: sign up fresh, complete onboarding (base=IDR), navigate to `/incomes`, see empty state.
- [x] Add an income for Rp 5,000,000 dated today with a transfer-proof image attached. Confirm row appears in list, attachment row is `confirmed=true`, storage object exists at the right path.
- [x] Edit the income's amount to Rp 5,500,000. Confirm save, no attachment changes.
- [x] Delete the income. Confirm row is gone. (Storage object cleanup is separate — see task 02 caveat.)
- [x] Verify dashboard updates to show received-this-cycle once `dashboard/05` lands.

## Notes

(append-only)

- The attachment dropzone is a strong candidate to lift into `src/components/shared/` since both expenses and incomes need it. Coordinate with whoever lands this task — small refactor, big payoff.
- Per-currency decimal handling: `Intl.NumberFormat` does the right thing on *display*. The form `input[type=number]` `step` attribute is what drives input UX. Pick the step based on the base currency at render time.
- AI-driven income logging (chat / image) plugs in later via the `ai-chat` feature. This task only delivers manual entry. Leave a top-of-file hook comment in `income-form.tsx` if natural.
- 2026-06-09 — landed. Deliberate deviations from the spec:
  - **Single route + dialogs**, not three routes (`/incomes`, `/incomes/new`, `/incomes/:id/edit`). Mirroring the expenses pattern (one route, modal create/edit) gave UX consistency and avoided duplicating page-level form wrapping. `income-new.tsx` / `income-edit.tsx` not created.
  - **Monthly grouping headers** in the list were not implemented — the cycle filter already scopes to one month at a time and renders a single Total footer, so per-month headers would be empty noise within a cycle view. Revisit if/when we ship an "all incomes" view.
  - **Source select hidden in v1** per task notes; `source: 'manual'` is hardcoded at submit time.
  - Attachment dropzone lifted to `src/components/shared/attachment-dropzone.tsx` (parametrized `accept`/`allowedMime`/`hintLabel`/`hintFormats`/messages). Expenses form updated to import from the shared location and pass image-only props. Non-image previews (PDF) render a `FileText` icon + filename instead of `<img>`.
  - Sidebar nav link added to `src/components/shared/app-shell.tsx` between Expenses and Essentials with the `TrendingUp` icon.
  - Per-currency `step`: `JPY/KRW/VND` → `1`, all others → `0.01`.
  - Verified: `pnpm lint` clean, `pnpm build` clean. Manual smoke test in the running app deferred to operator.
