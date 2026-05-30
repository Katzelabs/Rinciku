**Status:** not-started

## Goal

Small helper that returns the IDR-equivalent amount and the snapshotted FX rate to store inline on an expense row. The v1 implementation can use a fixed rate from config; the abstraction lets us swap in a live-rate fetch later without touching every caller.

## Acceptance criteria

- [ ] `src/lib/fx.ts` exports `getFxRate(from: 'IDR' | 'USD', to: 'IDR' | 'USD'): Promise<number>` and `convertToIdr({ amount, currency }): Promise<{ amount_idr: number, fx_rate_to_idr: number }>`.
- [ ] v1 implementation: return `1` for same-currency, return a hardcoded `USD_TO_IDR` constant (e.g. `16200`) defined at the top of the file with a `// TODO: replace with live rate` comment.
- [ ] Pure functions — no React. The expense form / image flow / chat flow all call them at log time.
- [ ] Exported types match the column types on `expenses` so the result can be spread into `createExpense` input.
- [ ] When live-rate work begins, only this file changes (consumers stay put).

## Notes
