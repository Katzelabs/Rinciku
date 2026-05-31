**Status:** done

## Goal

`/sign-in` route lets an existing user authenticate. Errors render inline; success lands the user on `/` (or `/onboarding` if their profile is incomplete — handled by the guard chain).

## Acceptance criteria

- [x] Zod schema `signInSchema` in `src/features/auth/schemas.ts`: email (valid), password (non-empty).
- [x] `src/features/auth/pages/sign-in.tsx` renders a shadcn `Form` against the schema. *(Implemented with `FieldGroup` + `Field` + react-hook-form `register()` — see Notes.)*
- [x] Submit calls `supabase.auth.signInWithPassword(...)`; on `AuthApiError` for invalid creds, show "Email or password is incorrect" as a form-level error (not a toast).
- [x] On success: navigate to `/`; the auth provider + guards take over from there. *(Also honours `?redirectTo=` if present, matching `requireAuthLoader`'s contract.)*
- [x] Route added to `authRoutes` wrapped in `<RequireGuest>`.
- [x] Link at the bottom: "Don't have an account? Sign up" → `/sign-up`.
- [x] Built via the `new-form` skill.

## Notes

- **Form primitive deviation.** The `new-form` skill assumes `@/components/ui/form.tsx` (the react-hook-form `Form`/`FormField` wrapper) is installed, but it isn't in this project and the shadcn CLI's `radix-rhea` preset doesn't ship it. The project's `.claude/skills/shadcn/rules/forms.md` explicitly says forms use `FieldGroup` + `Field` (already in `src/components/ui/field.tsx`). I followed the rule: `useForm({ resolver: zodResolver(...) })` + `register()` + `Field`/`FieldLabel`/`FieldError` (which accepts react-hook-form `FieldError` objects directly via its `errors` prop). Validation surfaces via `data-invalid` on the `Field` and `aria-invalid` on the `Input`.
- **Form-level error.** Bad creds set `form.setError('root', { message: 'Email or password is incorrect' })`, rendered by a `<FieldError errors={errors.root ? [errors.root] : undefined} />` sitting above the submit button. Detection: `isAuthApiError(error) && (error.code === 'invalid_credentials' || error.message === 'Invalid login credentials')`. Other errors fall through to "Something went wrong. Please try again."
- **Redirect target.** Reads & sanitizes `?redirectTo=` via a local `safeInternalPath` helper that mirrors the one in `loaders.ts:12`. Falls back to `/`. This preserves the deep-link experience when `requireAuthLoader` bounces a non-authed user to `/sign-in?redirectTo=/expenses`.
- **API layering.** Page does not import `supabase` directly. `signInWithPassword` lives in `src/features/auth/api.ts` and returns Supabase's raw `{ data, error }`, letting the page branch on the error code.
- **Build state.** `pnpm build` does not currently pass green, but the failure is in `src/features/auth/components/onboarding-form.tsx` (concurrent onboarding work), not in any sign-in file. Verified with `pnpm exec eslint` + `pnpm exec tsc -b --force` filtered to sign-in files — both clean.
