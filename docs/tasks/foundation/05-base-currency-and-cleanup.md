**Status:** not-started

## Goal

Refactor the multi-currency model from the IDR-hardcoded shape (`amount_idr`, `exchange_rate_to_idr`, two `monthly_income_*` columns) to a base-currency abstraction where the user picks one base at onboarding, every transactional form logs in that base, and historical rows preserve the base in effect when they were written. Drop snapshot FX columns that no longer carry information, expand the currency allow-list from 2 to 16 ISO codes, and rebuild the FX + formatting helpers around the new model.

This task is the foundation: every downstream rewire (auth, expenses, essentials, dashboard, incomes) depends on it landing first.

Reference: plan at `~/.claude/plans/good-let-s-create-the-sprightly-hennessy.md`. Schema doc to update: `docs/schema.md` (§1, §3, §6, §8, §11, §13, §14).

## Acceptance criteria

### Schema (`supabase/schemas/`)

- [ ] `10_profiles.sql`: drop `monthly_income_idr`, `monthly_income_usd`. Add `expected_monthly_income numeric(15,2) not null default 0`. Add `expected_monthly_income_currency text not null default 'IDR'` with the 16-code check. Expand `base_currency` check to the 16-code list.
- [ ] `12_essentials.sql`: expand `currency` check to the 16-code list.
- [ ] `13_expenses.sql`: drop `exchange_rate_to_idr` and the generated `amount_idr` column. Expand `currency` check to the 16-code list.
- [ ] `15_budgets.sql`: drop `amount_idr`. Add `amount numeric(15,2) not null check (amount >= 0)` and `currency text not null` with the 16-code check.
- [ ] `80_dashboard_functions.sql`: rewrite aggregations to take `(p_user_id, p_base text, p_rates jsonb)` and compute `sum(amount * (p_rates ->> currency)::numeric)`. Rename output columns from `*_idr` to drop the IDR suffix. Add an aggregation for `income_received_this_cycle` from the new `incomes` table (added in `incomes/01-schema.md`; coordinate ordering).
- [ ] `99_handle_new_user.sql`: any reference to `monthly_income_*` swapped for the new columns. Defaults still 0 / `'IDR'`.
- [ ] Currency allow-list (single source of truth): `'IDR','USD','EUR','JPY','GBP','SGD','MYR','AUD','CAD','CNY','KRW','HKD','THB','PHP','INR','VND'`. Replicated as a `check` on every `currency` column. Keep text + check (not enum/domain) per the §1 rationale.

### Migration + types

- [ ] Delete `supabase/migrations/0001_init.sql` and regen via `supabase db diff -f init`.
- [ ] `supabase db reset` runs clean.
- [ ] `supabase gen types` regenerates `src/lib/database.types.ts`.

### Schema docs (`docs/schema.md`)

- [ ] §1 — allow-list updated; note that base_currency is changeable in settings.
- [ ] §3 profiles — new income fields.
- [ ] §6 expenses — drop FX columns; row shape note updated.
- [ ] §8 budgets — amount + currency.
- [ ] §13 indexes summary — no new indexes for this task, but verify nothing was dropped accidentally.
- [ ] §14 out-of-scope — note that income source templates and live FX source remain v2.

### App code

- [ ] `src/lib/fx.ts` rewritten: export `CURRENCY_CODES` readonly tuple of the 16 codes, type `CurrencyCode = (typeof CURRENCY_CODES)[number]`, `RATES_TO_IDR: Record<CurrencyCode, number>` stub table with a TODO flagging the follow-up `06-live-fx-source.md`. New `convertToBase(amount, from, base)` returning `{ amount_base, rate }`, pivoting through IDR. Old `convertToIdr` removed.
- [ ] `src/lib/format.ts` (new): `formatCurrency(amount: number, code: CurrencyCode, locale?: string)` using `Intl.NumberFormat`. Default locale falls back to `'id-ID'` if not provided. Verify JPY/KRW/VND render with zero decimals automatically.
- [ ] `src/components/shared/currency-select.tsx` (new): shadcn Combobox (Command + Popover) listing all 16 codes with names. Props: `value`, `onChange`, optional `disabled` / `readOnly` (for display-only mode on transactional forms).
- [ ] Currency name map (e.g. `IDR → "Indonesian Rupiah"`) co-located with `CURRENCY_CODES` in `src/lib/fx.ts` or split into `src/lib/currency-meta.ts`.

### Cleanup of existing app references

These keep this task self-contained; they could be split off but probably go faster as one diff:

- [ ] `src/features/expenses/api.ts`: remove `exchange_rate_to_idr` and `amount_idr` from select shapes, insert/update payloads.
- [ ] `src/features/expenses/components/expense-form.tsx`: drop the `convertToIdr` call (around the existing line that references `convertToIdr({...})`). Submit just `amount + currency` where `currency = profile.base_currency`. The currency field renders read-only via `CurrencySelect` with `disabled` (or a plain label — whichever the design lands on).
- [ ] `src/features/expenses/pages/expenses.tsx` + `components/expense-table.tsx`: replace `Number(row.amount_idr ?? 0)` with `formatCurrency(Number(row.amount), row.currency)`. For sums, pull from the new dashboard function so mixed-history aggregation is correct.
- [ ] `src/features/essentials/` form: currency field read-only. Display via `formatCurrency`.
- [ ] `src/features/dashboard/api.ts`: drop the `Number(profile.monthly_income_idr ?? 0) + Number(profile.monthly_income_usd ?? 0) * fxRate` formula. New shape outlined in `dashboard/05-income-received-vs-expected.md`. This file may be left as a partial change here if `dashboard/05` is split.

### Verification

- [ ] `pnpm build` passes (typecheck included).
- [ ] `pnpm lint` passes.
- [ ] Manual: `pnpm dev`, sign up fresh, complete onboarding, log an expense in IDR, log an essential in IDR, dashboard renders without console errors.

## Notes

(append-only)

- Carve out `expenses/06-amount-base-rename.md` and `essentials/05-currency-display-only.md` only if the diff in this task gets unwieldy — they exist as scope markers but the work is identical and can land in one go.
- `auth/06-base-currency-rewire.md` depends on this task — onboarding form needs `CurrencySelect` and the new schema fields.
- `incomes/01-schema.md` can be authored in parallel but its migration regen must land together with this one (single rolling init).
- FX stub rates: pick a defensible snapshot date and document it inline so future readers know the values are frozen, not "live."
