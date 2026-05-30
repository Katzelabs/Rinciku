**Status:** not-started

## Goal

Populate `src/features/categories/api.ts` with typed Supabase queries/mutations for the `categories` table. No business logic in this file — that lives in components or hooks.

Reference: `docs/schema.md` §4 `categories`.

## Acceptance criteria

- [ ] `listCategories()` — returns all rows for the current user, ordered by `tier` then `name`. Typed as `Tables<'categories'>[]`.
- [ ] `createCategory(input)` — input is `Pick<Tables<'categories'>, 'name' | 'tier' | 'icon' | 'color'>`. `user_id` is set by the RLS-enforced default / from `auth.uid()`.
- [ ] `updateCategory(id, patch)` — patches name/tier/icon/color only.
- [ ] `deleteCategory(id)` — hard delete; relies on `on delete set null` on `expenses.category_id` (per schema §6).
- [ ] All functions return `{ data, error }` shaped output, where `error` is `PostgrestError | null` — surface, don't swallow.
- [ ] No fetching / state — pure Supabase calls. Wrap with TanStack Query in the page layer if needed (decide there, not here).
- [ ] Built via the `new-api` skill.

## Notes
