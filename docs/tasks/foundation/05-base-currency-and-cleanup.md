**Status:** done

## Goal

Refactor the multi-currency model from the IDR-hardcoded shape (`amount_idr`, `exchange_rate_to_idr`, two `monthly_income_*` columns) to a base-currency abstraction where the user picks one base at onboarding, every transactional form logs in that base, and historical rows preserve the base in effect when they were written. Drop snapshot FX columns that no longer carry information, expand the currency allow-list from 2 to 16 ISO codes, and rebuild the FX + formatting helpers around the new model.

This task is the foundation: every downstream rewire (auth, expenses, essentials, dashboard, incomes) depends on it landing first.

Reference: plan at `~/.claude/plans/good-let-s-create-the-sprightly-hennessy.md`. Schema doc to update: `docs/schema.md` (§1, §3, §6, §8, §11, §13, §14).

## Acceptance criteria

### Schema (`supabase/schemas/`)

- [x] `10_profiles.sql`: drop `monthly_income_idr`, `monthly_income_usd`. Add `expected_monthly_income numeric(15,2) not null default 0`. Add `expected_monthly_income_currency text not null default 'IDR'` with the 16-code check. Expand `base_currency` check to the 16-code list.
- [x] `12_essentials.sql`: expand `currency` check to the 16-code list.
- [x] `13_expenses.sql`: drop `exchange_rate_to_idr` and the generated `amount_idr` column. Expand `currency` check to the 16-code list.
- [x] `15_budgets.sql`: drop `amount_idr`. Add `amount numeric(15,2) not null check (amount >= 0)` and `currency text not null` with the 16-code check.
- [x] `80_dashboard_functions.sql`: rewrite aggregations to take `(p_start_at, p_end_at, p_base text, p_rates jsonb)` and compute `sum(amount * (p_rates ->> currency)::numeric / p_rates->>p_base)`. Output columns renamed: `spent_total`, `tier_fixed`, `tier_needs`, `tier_wants`. (Cycle window kept explicit; `p_user_id` implicit via `auth.uid()`.) **Deferred:** `income_received_this_cycle` aggregation — depends on the `incomes` table from `incomes/01-schema.md`; `dashboard/05-income-received-vs-expected.md` will extend the function when that lands.
- [x] `99_handle_new_user.sql`: trigger only inserts `(id, email)` — defaults cover the renamed/new columns. No edit needed; verified clean after regen.
- [x] Currency allow-list (single source of truth): `'IDR','USD','EUR','JPY','GBP','SGD','MYR','AUD','CAD','CNY','KRW','HKD','THB','PHP','INR','VND'`. Replicated as a `check` on every `currency` column. Keep text + check (not enum/domain) per the §1 rationale.

### Migration + types

- [x] Delete `supabase/migrations/20260605110740_init.sql` and regen via `supabase db diff -f init` → `20260609082207_init.sql`.
- [x] `supabase db reset` runs clean.
- [x] `supabase gen types` regenerates `src/lib/database.types.ts`.

### Schema docs (`docs/schema.md`)

- [x] §1 — allow-list updated; note that `base_currency` is changeable in settings; FX strategy reframed.
- [x] §3 profiles — new income fields (`expected_monthly_income`, `expected_monthly_income_currency`).
- [x] §5 essentials — currency check updated to 16 codes; note rewritten for `convertToBase`.
- [x] §6 expenses — `exchange_rate_to_idr` / `amount_idr` rows dropped; row-shape note rewritten.
- [x] §8 budgets — `amount` + `currency`.
- [x] §13 indexes summary — verified nothing dropped.
- [x] §14 out-of-scope — live FX source noted; income source templates noted; `exchange_rates` rationale updated.

### App code

- [x] `src/lib/fx.ts` rewritten: `CURRENCY_CODES` readonly tuple of 16 codes, `CurrencyCode` type, `RATES_TO_IDR` frozen snapshot (2026-06-09, TODO points to `foundation/06-live-fx-source.md`), `convertToBase(amount, from, base) → { amount_base, rate }` pivoting through IDR. `Currency`, `ConvertToIdrResult`, `getFxRate`, `convertToIdr` removed.
- [x] `src/lib/format.ts` (new): `formatCurrency(amount, code, locale = 'id-ID')` via `Intl.NumberFormat` — JPY/KRW/VND inherit zero-decimals from `Intl` automatically.
- [x] `src/components/shared/currency-select.tsx` (new): Combobox (`Command` + `Popover`) listing 16 codes with names. Props: `value`, `onChange`, `disabled`, `className`, `id`. Added shadcn `command` component at `src/components/ui/command.tsx`.
- [x] Currency name map split into `src/lib/currency-meta.ts` (`CURRENCY_NAMES`).

### Cleanup of existing app references

- [x] `src/features/expenses/api.ts`: `exchange_rate_to_idr` and `amount_idr` removed from `CreateExpenseInput`; type imports updated to `CurrencyCode`.
- [x] `src/features/expenses/components/expense-form.tsx`: `convertToIdr` call dropped; FX fields removed from payload; currency `Select` lists the 16 codes via `CURRENCY_CODES.map`. **Deferred to `expenses/06`:** lock the currency field to `profile.base_currency` (read-only via `CurrencySelect` disabled).
- [x] `src/features/expenses/pages/expenses.tsx` + `components/expense-table.tsx`: `amount_idr` references replaced with `convertToBase(...).amount_base`; totals shown via `formatCurrency(total, baseCurrency)`. The dashboard SQL function will own multi-row aggregation correctness when `dashboard/05` lands.
- [x] `src/features/essentials/` form + table + summary + baseline: amount renamed `total_base`; `computeBaseline` now takes `base: CurrencyCode` and calls `convertToBase`; `formatCurrency` used for all display. Currency `Select` lists the 16 codes. **Deferred to `essentials/05`:** lock the currency field to base (read-only).
- [x] `src/features/dashboard/api.ts`: obsolete IDR formula dropped; `expected_monthly_income` converted via `convertToBase`; new RPC signature `(p_start_at, p_end_at, p_base, p_rates)` wired with `RATES_TO_IDR`. **Deferred to `dashboard/05`:** the income-received-vs-expected widget (needs `incomes` table) and the variable-income hide-when-zero UX.
- [x] `src/features/auth/components/profile-form.tsx` + `schemas.ts` + `api.ts`: two income inputs collapsed to a single `expected_monthly_income`; `base_currency` Select expanded to 16 codes; `upsertProfile` sets `expected_monthly_income_currency = base_currency` at submit. **Deferred to `auth/06`:** `CurrencySelect` combobox adoption, settings-side base-change confirmation modal.

### Verification

- [x] `pnpm build` passes (typecheck included).
- [x] `pnpm lint` passes.
- [ ] Manual: `pnpm dev`, sign up fresh, complete onboarding, log an expense in IDR, log an essential in IDR, dashboard renders without console errors. _(local manual smoke recommended before merging — automated checks all green.)_

## Notes

(append-only)

- Carve out `expenses/06-amount-base-rename.md` and `essentials/05-currency-display-only.md` only if the diff in this task gets unwieldy — they exist as scope markers but the work is identical and can land in one go.
- `auth/06-base-currency-rewire.md` depends on this task — onboarding form needs `CurrencySelect` and the new schema fields.
- `incomes/01-schema.md` can be authored in parallel but its migration regen must land together with this one (single rolling init).
- FX stub rates: pick a defensible snapshot date and document it inline so future readers know the values are frozen, not "live."
- 2026-06-09 — scope decisions for this PR (per user direction):
  - **Incomes table out of scope.** `incomes/01-schema.md` left untouched; the new `dashboard_monthly_summary` does NOT include an `income_received_this_cycle` aggregation. When `incomes/01` lands, the migration will regen again and `dashboard/05` will extend the function.
  - **Foundation-only cleanup of feature code.** Expense/essential forms still let the user pick currency from the 16-code list; locking the field to `profile.base_currency` (the read-only-disabled UX) is left to `expenses/06` / `essentials/05`. Onboarding similarly uses a plain `Select` over 16 codes; the `CurrencySelect` combobox debut is `auth/06`.
  - **Dashboard is minimum-to-compile.** `dashboard/api.ts` now reads `expected_monthly_income` through `convertToBase` and calls the new RPC signature, but the Received-vs-Expected widget + variable-income hide-when-zero logic stay in `dashboard/05`.
- FX snapshot frozen at 2026-06-09 (`src/lib/fx.ts` carries the date inline + a TODO pointer to `foundation/06-live-fx-source.md`).
- New shadcn `command` component installed (`src/components/ui/command.tsx`); `cmdk` added as a dependency by the shadcn CLI.
- TS type regen via `supabase gen types ... --local > database.types.ts` includes a stderr "Connecting to db" line; strip it manually until the CLI is upgraded past v2.101.0.
