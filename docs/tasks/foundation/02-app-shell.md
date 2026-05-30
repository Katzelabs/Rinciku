**Status:** not-started

## Goal

A persistent authenticated layout — sidebar navigation on desktop, top bar with a drawer on mobile — that wraps every authenticated route. Unauthenticated routes (sign-in / sign-up / onboarding) render outside this shell.

## Acceptance criteria

- [ ] `src/components/shared/app-shell.tsx` exports `<AppShell />` with a sidebar + topbar + `<Outlet />` content area.
- [ ] Sidebar contains nav links for Dashboard, Expenses, Essentials, Categories (Budgets and AI Chat shown as disabled placeholders so the nav is final).
- [ ] Topbar shows the current user's email (from `useAuth`) and a placeholder slot for the account menu (filled in `auth/04-account-settings.md`).
- [ ] Mobile (`<md`): sidebar collapses behind a hamburger using a shadcn `Sheet`.
- [ ] `src/app/router.tsx` nests authenticated feature routes under `<AppShell />`; auth routes stay at the top level under `RootLayout` only.
- [ ] Active nav link is visually marked using `NavLink`'s active state (no manual pathname comparisons).

## Notes
