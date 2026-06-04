**Status:** done

## Goal

Reusable create/edit form for one essential line item.

## Acceptance criteria

- [ ] Zod schema `essentialSchema` in `src/features/essentials/schemas.ts`: `name` (non-empty), `estimated_amount` (numeric > 0), `currency` (`'IDR' | 'USD'`), `category_id` (uuid), `notes` (optional string).
- [ ] `src/features/essentials/components/essential-form.tsx` exposes `<EssentialForm mode defaultValues onSuccess />`.
- [ ] Built via the `new-form` skill.
- [ ] Category field is a shadcn `Select` populated from `listCategories()`; defaults to the user's first "fixed" category.
- [ ] Submit calls the appropriate api.ts function; surfaces errors via toast; calls `onSuccess`.

## Notes

- Form accepts a `notes` field per spec, but the `essentials` DB table has no `notes` column today (see `database.types.ts`). The form input is wired but not persisted — submit payload omits it. Follow-up: either add `notes text` to `supabase/schemas/05_essentials.sql` and regenerate, or drop the field.
