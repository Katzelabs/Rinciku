**Status:** done

## Goal

Close the security gaps in the `/sign-up` flow identified by a focused audit on 2026-05-31: align client and server password policy, give users live validation feedback, normalize email inputs, and stop leaking account existence through error messages.

## Acceptance criteria

- [x] `signUpSchema` enforces password rules: ≥ 8 chars, ≥ 1 uppercase, ≥ 1 lowercase, ≥ 1 digit. Rules exported as `passwordPolicy` so the form and the schema share a single source of truth.
- [x] Email is normalized at the schema level (`trim().toLowerCase()`) so `api.ts` receives canonical values.
- [x] The sign-up form renders a live password rules checklist that ticks rules off as the user types.
- [x] Supabase error messages are remapped through `mapSignUpError` so account-enumeration leaks ("User already registered") become generic copy.
- [x] `supabase/config.toml` enforces the same policy server-side: `minimum_password_length = 8`, `password_requirements = "lower_upper_letters_digits"`.
- [x] `pnpm build` and `pnpm lint` stay clean.

## Notes

- 2026-05-31 — Audit findings worth keeping around:
  - **Already OK** before this task: React auto-escapes JSX, `autoComplete='new-password'` set on both password fields, submit double-click protected by `disabled={isSubmitting}`, sign-up page does not read `redirectTo` from URL params (only sign-in does, with the `safeInternalPath` guard in `loaders.ts`), no sensitive data logged anywhere. CSRF is not applicable (Supabase SPA uses bearer tokens, not cookie sessions).
  - **Server-side rate limit** stays at the existing baseline: `sign_in_sign_ups = 30/5min/IP` in `[auth.rate_limit]`. The new error mapper surfaces `over_request_rate_limit` / `over_email_send_rate_limit` codes as a polite "Too many attempts" message.
- **Hosted Supabase project follow-up**: when we eventually deploy, set the matching values in Project Settings → Authentication → Password Policy. `config.toml` only governs the local dev stack.
- **Local DB reset required** after editing `config.toml`: run `supabase db reset` to reapply auth config (per CLAUDE.md's pre-release workflow).
- **`signInSchema` intentionally not changed** — accounts created before this policy must still be able to sign in.

## Out of scope (future tasks)

- **CAPTCHA** (hCaptcha or Turnstile) — `[auth.captcha]` is commented out in `config.toml`. Needs provider credentials and a token round-trip through `signUpWithPassword`. Worth a dedicated task.
- **CSP / security headers** (X-Frame-Options, HSTS, etc.) — belongs in the deployment layer (Vercel / Netlify / Nginx), not in the SPA bundle.
- **HIBP leaked-password check** — Supabase hosted exposes "Password protection (HaveIBeenPwned)" in the dashboard; not present in local `config.toml`. Revisit when wiring the hosted project.
