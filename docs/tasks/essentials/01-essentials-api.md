**Status:** done

## Goal

Populate `src/features/essentials/api.ts` with typed Supabase queries/mutations for the `essentials` table.

Reference: `docs/schema.md` §5 `essentials`.

## Acceptance criteria

- [ ] `listEssentials()` — returns all rows for the current user, joined with the linked `categories` row (`category:categories(*)`) for tier filtering on the client.
- [ ] `createEssential(input)` — input fields per schema §5 (name, estimated_amount, currency, category_id, notes).
- [ ] `updateEssential(id, patch)`.
- [ ] `deleteEssential(id)`.
- [ ] Returns `{ data, error }`; surfaces `PostgrestError`.
- [ ] No business logic in this file (the IDR-equivalent computation lives in `04-monthly-baseline-summary.md`).
- [ ] Built via the `new-api` skill.

## Notes
