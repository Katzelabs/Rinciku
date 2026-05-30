**Status:** not-started

## Goal

Install the shadcn baseline used across every feature so individual feature tasks don't each have to think about it. Confirm shared utilities (`cn`, toast) so the rest of the roadmap can assume they exist.

## Acceptance criteria

- [ ] Components present in `src/components/ui/`: `button`, `input`, `label`, `form`, `card`, `dialog`, `dropdown-menu`, `select`, `table`, `sonner`, `sheet`, `badge`, `skeleton`, `separator`.
- [ ] Added via the `shadcn` skill, not hand-rolled.
- [ ] `<Toaster />` from `sonner` mounted once in `src/app/providers.tsx` so `toast.success(...)` works from any feature.
- [ ] `cn()` helper in `src/lib/utils.ts` is unchanged and used in any new components.
- [ ] `pnpm build` passes with the additions (typecheck green).

## Notes
