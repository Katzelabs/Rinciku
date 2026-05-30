**Status:** done

## Goal

A persistent authenticated layout — sidebar navigation on desktop, top bar with a drawer on mobile — that wraps every authenticated route. Unauthenticated routes (sign-in / sign-up / onboarding) render outside this shell.

## Acceptance criteria

- [x] `src/components/shared/app-shell.tsx` exports `<AppShell />` with a sidebar + topbar + `<Outlet />` content area.
- [x] Sidebar contains nav links for Dashboard, Expenses, Essentials, Categories (Budgets and AI Chat shown as disabled placeholders so the nav is final).
- [x] Topbar shows the current user's email (from `useAuth`) and a placeholder slot for the account menu (filled in `auth/04-account-settings.md`).
- [x] Mobile (`<md`): sidebar collapses behind a hamburger using a shadcn `Sheet`.
- [x] `src/app/router.tsx` nests authenticated feature routes under `<AppShell />`; auth routes stay at the top level under `RootLayout` only.
- [x] Active nav link is visually marked using `NavLink`'s active state (no manual pathname comparisons).

## Notes

- Adopted the shadcn `sidebar-07` block pattern (`collapsible='icon'`). Brand row uses lucide `Coins`; nav uses `LayoutDashboard` / `Receipt` / `Wallet` / `Tag`; disabled placeholders use `PiggyBank` / `Sparkles`.
- Installed shadcn components: `sidebar`, `sheet`, `separator`, `tooltip`, `skeleton`, `dropdown-menu`, `breadcrumb`, `avatar`. `TooltipProvider` is wired in `src/app/providers.tsx` so `SidebarMenuButton` tooltips work in collapsed mode.
- Active state is driven by `NavLink`'s `className` callback applying `bg-sidebar-accent font-medium text-sidebar-accent-foreground` — the same tokens shadcn applies to `data-active`. No `useLocation`/pathname checks.
- Each enabled nav link points to a one-line "Coming soon" placeholder page (`src/features/{dashboard,expenses,essentials,categories}/pages/`) so the shell is visually verifiable. These pages are stubs to be replaced by their respective feature tasks (e.g. `dashboard/02-dashboard-page.md`).
- Auth gating is intentionally NOT wired here — that's `foundation/03-route-guards.md`. For now the shell will render regardless of auth state; the topbar email falls back to an empty span when there's no session.
- `eslint.config.js` gained an override for `src/components/ui/**` and `src/hooks/use-mobile.ts` to silence `react-refresh/only-export-components` and `react-hooks/set-state-in-effect` on shadcn-generated files (these patterns are part of shadcn's output, not our code).
