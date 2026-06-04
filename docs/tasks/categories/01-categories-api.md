**Status:** done

## Goal

Populate `src/features/categories/api.ts` with typed Supabase queries/mutations for the `categories` table. No business logic in this file — that lives in components or hooks.

Reference: `docs/schema.md` §4 `categories`.

## Acceptance criteria

- [x] `listCategories()` — returns all rows for the current user, ordered by `tier` then `name`. Typed as `Tables<'categories'>[]`.
- [x] `createCategory(input)` — input is `Pick<Tables<'categories'>, 'name' | 'tier' | 'icon' | 'color'>`. `user_id` is set by the RLS-enforced default / from `auth.uid()`.
- [x] `updateCategory(id, patch)` — patches name/tier/icon/color only.
- [x] `deleteCategory(id)` — hard delete; relies on `on delete set null` on `expenses.category_id` (per schema §6).
- [x] All functions return `{ data, error }` shaped output, where `error` is `PostgrestError | null` — surface, don't swallow.
- [x] No fetching / state — pure Supabase calls. Wrap with TanStack Query in the page layer if needed (decide there, not here).
- [x] Built via the `new-api` skill.

## Notes

- `createCategory` accepts `user_id` explicitly (caller pulls it from `useAuth().user.id`) instead of relying on a DB default. Mirrors the existing expenses api pattern; RLS still enforces ownership.
- `listCategories` keeps the existing `is_archived = false` filter; archiving UI is out of scope for this milestone. Ordering is `tier, sort_order, name` (sort_order takes precedence over name within a tier for stable display).
