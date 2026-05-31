**Status:** done

## Goal

Install the shadcn baseline used across every feature so individual feature tasks don't each have to think about it. Confirm shared utilities (`cn`, toast) so the rest of the roadmap can assume they exist.

## Acceptance criteria

- [x] Components present in `src/components/ui/`: `button`, `input`, `label`, `field` (replaces legacy `form`), `card`, `dialog`, `dropdown-menu`, `select`, `table`, `sonner`, `sheet`, `badge`, `skeleton`, `separator`.
- [x] Added via the `shadcn` skill, not hand-rolled.
- [x] `<Toaster />` from `sonner` mounted once in `src/app/providers.tsx` so `toast.success(...)` works from any feature.
- [x] `cn()` helper in `src/lib/utils.ts` is unchanged and used in any new components.
- [x] `pnpm build` passes with the additions (typecheck green).

## Notes

- 2026-05-31: Added `form`, `dialog`, `select`, `table`, `sonner`, `badge` via `pnpm dlx shadcn@latest add`. The shadcn `form` primitive has been replaced upstream by `field` in the current radix-rhea style (FieldGroup / Field / FieldLabel / FieldError, etc.), so `field` was installed in its place. Forms should compose `Field` + react-hook-form directly rather than the legacy `<Form>` wrapper.
- Existing components untouched: `button`, `input`, `label`, `card`, `dropdown-menu`, `sheet`, `skeleton`, `separator` (plus `avatar`, `breadcrumb`, `sidebar`, `tooltip` from prior work).
- `Toaster` mounted in `src/app/providers.tsx` inside `TooltipProvider`. Uses default `next-themes` theming (already a dependency).
- `pnpm build` passes (tsc -b + vite build, 717ms).
