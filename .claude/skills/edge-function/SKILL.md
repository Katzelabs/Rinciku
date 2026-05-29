---
name: edge-function
description: Scaffold a Supabase Edge Function under supabase/functions/<name>/ for Rinciku. Default use case is proxying Claude API calls for the ai-chat feature so the API key never lands in the browser. Includes JWT verification and CORS template.
---

# edge-function

## When to use

- The user wants to call the Claude API (or any third-party API requiring a secret key) — the secret must not be bundled into the SPA.
- The user asks to add server logic that needs database access with elevated privileges (rare; prefer RLS + client-side calls when possible).
- The user mentions "edge function", "serverless function", or "backend endpoint".

## Steps

1. **Create the function directory and entry**:
   ```bash
   supabase functions new <function-name>
   ```
   This generates `supabase/functions/<function-name>/index.ts` with a Deno HTTP handler stub. (Edge runtime is Deno 2 per `supabase/config.toml`.)
2. **Write the handler**. Template for an authenticated function that proxies Claude:
   ```ts
   import { createClient } from 'jsr:@supabase/supabase-js@2';
   import Anthropic from 'npm:@anthropic-ai/sdk';

   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };

   Deno.serve(async (req) => {
     if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

     // 1. Verify the caller is a signed-in Rinciku user.
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

     const supabase = createClient(
       Deno.env.get('SUPABASE_URL')!,
       Deno.env.get('SUPABASE_ANON_KEY')!,
       { global: { headers: { Authorization: authHeader } } },
     );
     const { data: { user }, error: userErr } = await supabase.auth.getUser();
     if (userErr || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

     // 2. Do the work (e.g. call Claude). Secret comes from env, never the client.
     const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
     const body = await req.json();
     const result = await anthropic.messages.create({
       model: '<current-latest-sonnet-4.x-id>', // confirm at wire-up time per CLAUDE.md
       max_tokens: 1024,
       messages: body.messages,
     });

     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   });
   ```
3. **Set secrets** (locally + remote). Never commit them.
   - Local: add to `supabase/functions/.env` (gitignored) — `ANTHROPIC_API_KEY=sk-ant-...`
   - Remote: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
4. **Serve locally**:
   ```bash
   supabase functions serve <function-name> --env-file supabase/functions/.env
   ```
   Test with `curl http://127.0.0.1:54321/functions/v1/<function-name>` plus a valid `Authorization: Bearer <user-jwt>` header.
5. **Call from the SPA** via the Supabase client `functions.invoke` — never via raw `fetch` to a hardcoded URL:
   ```ts
   const { data, error } = await supabase.functions.invoke('<function-name>', { body: { messages } });
   ```
   Place this call in the feature's `api.ts` (e.g. `features/ai-chat/api.ts`).
6. **Deploy** when ready:
   ```bash
   supabase functions deploy <function-name>
   ```

## Conventions to enforce

- The user JWT is verified on every request — no public/unauthenticated edge functions in this project.
- Secrets live in env (local `.env` file or `supabase secrets`), never in code or the client bundle.
- CORS headers must be returned on the preflight (`OPTIONS`) and the actual response. Use the snippet above as the floor.
- The SPA calls edge functions via `supabase.functions.invoke`, never raw `fetch`. The invoke wrapper attaches the auth header for us.
- Edge function code lives at `supabase/functions/<function-name>/index.ts` only — split helpers into sibling files (e.g. `_lib.ts`) underscore-prefixed so the CLI doesn't treat them as separate functions.
- For Claude API calls: use the current latest Sonnet 4.x model ID at wire-up time per `CLAUDE.md`. Do not hardcode an outdated ID from this skill template.

## Verification

- `supabase functions serve <name>` starts without errors.
- `curl` with a valid bearer token returns 200; without it returns 401.
- The function appears in Supabase Studio under Edge Functions after deploy.
- Confirm via the browser network tab that the SPA never sees `ANTHROPIC_API_KEY` — only the proxied response.
