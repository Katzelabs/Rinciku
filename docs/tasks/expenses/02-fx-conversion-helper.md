**Status:** done

## Goal

Small helper that returns the IDR-equivalent amount and the snapshotted FX rate to store inline on an expense row. The v1 implementation can use a fixed rate from config; the abstraction lets us swap in a live-rate fetch later without touching every caller.

## Acceptance criteria

- [x] `src/lib/fx.ts` exports `getFxRate(from: 'IDR' | 'USD', to: 'IDR' | 'USD'): Promise<number>` and `convertToIdr({ amount, currency }): Promise<{ amount_idr: number, exchange_rate_to_idr: number }>`.
- [x] v1 implementation: return `1` for same-currency, return a hardcoded `USD_TO_IDR` constant (e.g. `16200`) defined at the top of the file with a `// TODO: replace with live rate` comment.
- [x] Pure functions — no React. The expense form / image flow / chat flow all call them at log time.
- [x] Exported types match the column types on `expenses` so the result can be spread into `createExpense` input.
- [x] When live-rate work begins, only this file changes (consumers stay put).

## Notes

- 2026-06-03: Implemented at `src/lib/fx.ts`. Exports `Currency`, `ConvertToIdrResult`, `getFxRate`, `convertToIdr`. `USD_TO_IDR = 16200`.
- Renamed the result field from the task spec's `fx_rate_to_idr` to `exchange_rate_to_idr` to match the actual `expenses` column (`docs/schema.md` §6 and `database.types.ts`). This lets callers spread the result straight into a Supabase insert.
- `amount_idr` is returned for UI preview only — it's a PostgreSQL generated stored column (`round(amount * exchange_rate_to_idr, 2)`), so consumers must NOT include it in insert payloads. Rounding in JS mirrors the DB so the previewed value equals what gets stored.
- Functions are `async` so the future live-rate swap stays non-breaking.
