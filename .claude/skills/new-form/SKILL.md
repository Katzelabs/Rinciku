---
name: new-form
description: Build a form using react-hook-form + Zod + shadcn Form components inside a Rinciku feature. Defines the Zod schema in the feature's schemas.ts, the form component in components/, and wires onSubmit to the feature's action or api call.
---

# new-form

## When to use

- The user asks to build a form (sign-in, expense entry, budget editor, settings, etc.).
- Anywhere user input needs validation before it hits the data layer.
- Do **not** use this skill for non-form UI (use `ui-component`) or for the data layer itself (use `new-api`).

## Steps

1. Identify the target feature under `apps/web/src/features/<feature>/`.
2. **Schema** — add the Zod schema to `apps/web/src/features/<feature>/schemas.ts`. Export both the schema and the inferred type:
   ```ts
   import { z } from 'zod';

   export const <Name>Schema = z.object({
     // fields...
   });
   export type <Name>Input = z.infer<typeof <Name>Schema>;
   ```
3. **shadcn Form primitive** — verify `apps/web/src/components/ui/form.tsx` exists. If not, install with `add-shadcn-ui` (`form` component). The shadcn `Form` wraps react-hook-form's `FormProvider` and provides `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`.
4. **Form component** — create the form at `apps/web/src/features/<feature>/components/<name>-form.tsx`:
   ```tsx
   import { zodResolver } from '@hookform/resolvers/zod';
   import { useForm } from 'react-hook-form';
   import { <Name>Schema, type <Name>Input } from '../schemas';
   // shadcn Form imports from '@/components/ui/form', Input from '@/components/ui/input', etc.

   export function <Name>Form({ onSubmit }: { onSubmit: (values: <Name>Input) => Promise<void> | void }) {
     const form = useForm<<Name>Input>({
       resolver: zodResolver(<Name>Schema),
       defaultValues: { /* ... */ },
     });
     return (
       <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)}>
           {/* <FormField> entries */}
         </form>
       </Form>
     );
   }
   ```
5. **Wiring** — the form must not call Supabase directly. Pass `onSubmit` from the page, which forwards to:
   - the feature's `actions.ts` (when used as a react-router action), or
   - the feature's `api.ts` function (when called imperatively from a handler).
6. Run `pnpm build`.

## Conventions to enforce

- One schema per form (or per logical input shape) lives in the feature's `schemas.ts`.
- Always use `zodResolver` from `@hookform/resolvers/zod`.
- Use the shadcn `Form` primitive (`@/components/ui/form`), not raw `<form>` with manual `register` calls — it gives consistent error/aria handling.
- Form components live under `apps/web/src/features/<feature>/components/`, kebab-case filenames, named export `<Name>Form`.
- Submit handler is a prop, not hardcoded — keeps the form testable and reusable.
- Validate currency / IDR amounts with `z.number().int().nonnegative()` when storing in minor units (cents/rupiah-sen). Be explicit about units in field comments only when non-obvious.
- Trust the React Compiler — no `useCallback` on the submit handler.

## Verification

- `pnpm build` succeeds.
- In `pnpm dev`, fill the form with invalid input and confirm field-level error messages render (via `FormMessage`).
- Submit with valid input and confirm `onSubmit` is called with the typed values.
