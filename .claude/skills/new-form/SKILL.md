---
name: new-form
description: Build a validated form with react-hook-form + Zod in a Rinciku feature. The Zod schema is a make<Name>Schema(t) factory in @rinciku/domain/<feature> (shared + i18n-aware); the form UI is shadcn Form on web or React Native fields on mobile, wired to onSubmit.
---

# new-form

## When to use

- The user asks to build a form (sign-in, expense entry, budget editor, settings, etc.).
- Anywhere user input needs validation before it hits the data layer.
- Do **not** use this skill for the data layer itself (use `new-api`).

## Steps

### 1. Schema — a factory in `@rinciku/domain` (shared, i18n-aware)

Schemas are **not** plain `z.object` exports — they are `make<Name>Schema(t)` factories so validation messages are translated (see `packages/domain/src/features/auth/schemas.ts`). Add/extend the schema in `packages/domain/src/features/<feature>/schemas.ts`:
```ts
import { z } from 'zod';
import type { TFunction } from 'i18next';

export function make<Name>Schema(t: TFunction) {
  return z.object({
    // field: z.string().min(1, t('errors.<key>')),
  });
}
export type <Name>Input = z.infer<ReturnType<typeof make<Name>Schema>>;
```
The app's `features/<feature>/schemas.ts` just re-exports it from `@rinciku/domain/<feature>` (one-line shim — see `apps/web/src/features/auth/schemas.ts`). Add any new i18n keys to the feature's locale namespace (see `project_i18n` conventions in `CLAUDE.md`/memory).

### 2. Form component — platform-specific UI, same schema

The resolver pattern is identical on both platforms — `useForm` + `zodResolver(make<Name>Schema(t))` — only the field UI differs.

**Web** (`apps/web/src/features/<feature>/components/<name>-form.tsx`) uses the shadcn `Form` primitive:
```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { make<Name>Schema, type <Name>Input } from '../schemas';
// Form/FormField/FormItem/FormLabel/FormControl/FormMessage from '@/components/ui/form'

export function <Name>Form({ onSubmit }: { onSubmit: (values: <Name>Input) => Promise<void> | void }) {
  const { t } = useTranslation('<feature>');
  const form = useForm<<Name>Input>({
    resolver: zodResolver(make<Name>Schema(t)),
    defaultValues: { /* ... */ },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>{/* <FormField> entries */}</form>
    </Form>
  );
}
```
If `apps/web/src/components/ui/form.tsx` is missing, install the shadcn `form` component first (`shadcn` skill).

**Mobile** (`apps/mobile/src/features/<feature>/components/<name>-form.tsx`) — no shadcn; use react-hook-form's `Controller` with the feature's RN field components (mirror `apps/mobile/src/features/auth/components/`: `text-field.tsx`, `password-field.tsx`, `button.tsx`). Same `make<Name>Schema(t)` resolver. Style with `StyleSheet` + tokens from `@/constants/theme` — **no Tailwind/NativeWind**.

### 3. Wiring

The form must not call Supabase directly. Pass `onSubmit` from the page/screen, which forwards to:
- **web**: the feature's `actions.ts` (react-router action) or its `api.ts` shim function.
- **mobile**: the feature's `api.ts` shim function (called from the screen/hook).

Both ultimately reach the `@rinciku/domain` data factory.

### 4. Verify

- Web: `pnpm build`. Mobile: `pnpm --filter @rinciku/mobile typecheck`.

## Conventions to enforce

- One `make<Name>Schema(t)` factory per form lives in `@rinciku/domain/<feature>/schemas.ts`; apps re-export it. Don't define a fresh `z.object` in an app's `schemas.ts`.
- Always `zodResolver` from `@hookform/resolvers/zod`, called with the schema **built from `t`** so messages localize.
- Web: use the shadcn `Form` primitive (`@/components/ui/form`), not raw `<form>` + manual `register`. Mobile: use `Controller` + the feature's RN field components.
- Form components live under each app's `features/<feature>/components/`, kebab-case filenames, named export `<Name>Form`.
- Submit handler is a prop, not hardcoded.
- Currency amounts use the shared `CurrencyAmountInput` via `Controller` (decimals driven by currency — IDR=0); store **minor units** as integers. Don't hand-roll number inputs (see `project_currency_amount_input` memory).
- Trust the React Compiler (both apps enable it) — no `useCallback` on the submit handler.

## Verification

- Web `pnpm build` / mobile typecheck succeeds.
- Fill the form with invalid input and confirm field-level error messages render **in the active language**.
- Submit valid input and confirm `onSubmit` fires with the typed values.
