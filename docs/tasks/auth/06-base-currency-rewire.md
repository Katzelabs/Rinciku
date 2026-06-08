**Status:** not-started

## Goal

Rewire the onboarding + account-settings profile form to match the new base-currency model from `foundation/05-base-currency-and-cleanup.md`. Collapse the two `monthly_income_*` inputs into a single `expected_monthly_income` field, add a base-currency picker, and gate base-currency *changes* (in settings) behind a confirmation modal that explains the historical-display implication.

Depends on `foundation/05` (schema fields, `CurrencySelect`, regen types).

## Acceptance criteria

### Schemas

- [ ] `src/features/auth/schemas.ts`: drop `monthly_income_idr` and `monthly_income_usd`. Add `expected_monthly_income` (Zod number, `min(0)`). Add `expected_monthly_income_currency` (Zod enum of `CURRENCY_CODES`). Add `base_currency` (Zod enum of `CURRENCY_CODES`). Schema is shared between onboarding and settings — diverge if the validation rules differ.

### Onboarding (`profile-form.tsx`, onboarding flow)

- [ ] `src/features/auth/components/profile-form.tsx`: remove the two income number inputs (current lines 105 and 135). Add a single amount input plus an inline display of the chosen `base_currency` (read-only, no picker on the same field).
- [ ] Add a `CurrencySelect` for `base_currency` near the top of the form (this drives the implicit currency of the income field, essentials, expenses, etc.).
- [ ] `expected_monthly_income_currency` is **not** a separate input — it's set equal to `base_currency` on submit. The DB stores it explicitly so the value is robust even if base changes later.
- [ ] Helper text on the income field: *"Your typical monthly income. If you have multiple streams, enter your main one — log others on the Incomes page."*
- [ ] Default form values: `initialValues?.expected_monthly_income ?? 0`, `base_currency ?? 'IDR'`.

### Settings (account page)

- [ ] Same form shape as onboarding, but base_currency change goes through a confirmation modal with this wording: *"Historical totals will be displayed in the new currency going forward. Past row data is not modified."*
- [ ] Modal has Cancel and Confirm buttons. Only the Confirm path submits. (Reuse shadcn `AlertDialog` for this.)
- [ ] If base_currency is unchanged on submit, no modal — submit goes through directly.

### Verification

- [ ] `pnpm build` passes.
- [ ] Manual: sign up fresh, complete onboarding picking USD. Confirm the saved profile has `base_currency='USD'`, `expected_monthly_income_currency='USD'`, the entered amount on `expected_monthly_income`.
- [ ] Manual: in settings, change base from USD to JPY — modal appears with the right copy, confirm, profile updates.
- [ ] Manual: in settings, change the income amount but leave base alone — no modal, submit succeeds.

## Notes

(append-only)

- The settings flow is deliberately friction-y on base change — we want users to understand it's a meaningful action. Don't try to make it one-click.
- Out of scope: re-snapshotting historical rows when base changes. That's the design we agreed on.
- If the account settings page lives somewhere other than `src/features/auth/`, update this task with the correct path before starting.
