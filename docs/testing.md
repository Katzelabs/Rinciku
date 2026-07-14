# Rinciku — Testing

> What is tested, where it lives, and how to run it. The strategy is deliberately narrow: test where a failure is **invisible** (wrong money/date math, leaked data) or **irreversible**, and skip the rest until the product or team grows.

**Stack:** [Vitest](https://vitest.dev) for TypeScript unit tests (per package); [pgTAP](https://pgtap.org) via the Supabase CLI for database policy tests. No E2E, component, or mobile test runner is configured yet — see [Not tested yet](#not-tested-yet).

---

## Table of contents

1. [Commands](#commands)
2. [Unit tests (Vitest)](#unit-tests-vitest)
3. [Database tests (pgTAP)](#database-tests-pgtap)
4. [CI](#ci)
5. [What to test where](#what-to-test-where)
6. [Not tested yet](#not-tested-yet)

---

## Commands

Run from the repo root:

| Command | What it runs | Needs |
| --- | --- | --- |
| `pnpm test` | `turbo run test` — every workspace's Vitest suites | nothing (pure logic) |
| `pnpm test:db` | `supabase test db` — the pgTAP suites in `supabase/tests/` | local Supabase stack up |
| `pnpm --filter @rinciku/core test` | just the core suites | nothing |
| `pnpm --filter @rinciku/domain test` | just the domain suites | nothing |

`pnpm test` is fast and cached by Turborepo — run it freely. `pnpm test:db` requires `supabase start` first (it boots Postgres + replays the full migration history).

---

## Unit tests (Vitest)

Tests live next to the code they cover as `*.test.ts`, picked up by each package's `vitest.config.ts` (`include: ['src/**/*.test.ts']`). Both target packages hold pure, portable logic — no DOM, no React, no Supabase client — so they run in the `node` environment with no setup.

### `packages/core` — money & date math

The shared, framework-free brain. This is where a silently-wrong number would mislead a user about their budget, so correctness is pinned hard:

- `format.test.ts` — symbol-based currency formatting (the "never render the ISO code `IDR`" regression), IDR/JPY zero-decimal rounding, sign placement, compact notation, locale separators.
- `currency-meta.test.ts` — symbols (incl. `CN¥` vs `¥`), fraction digits, flags, full-coverage table checks.
- `cycle.test.ts` — billing-cycle math: before-start-day rollback, the January year-boundary case, `month_start_day` clamping to 1..28, days-left (the number the AI grounds advice on), period presets.
- `csv.test.ts` — CSV-injection escaping (OWASP formula guard), header parse/validation, the date-only → local-noon rule.
- `fx.test.ts` — IDR-pivot conversion, 2-decimal rounding, same-currency identity, stub integrity.

### `packages/domain` — the shared brain (schemas + AI gate)

- `features/ai-chat/agent-tools.test.ts` — **the AI write-confirm boundary.** Read tools auto-execute inside the loop; write tools (`propose_*`, `export_transactions`) must end the turn with a card the user approves. Tests assert every tool is classified as *exactly one* of read/write, that a write tool can never be misclassified as auto-executing read, that unknown tool names route nowhere, and that `parseChange` rejects hallucinated actions/entities.
- `features/ai-chat/schemas.test.ts` — the raw-tool-input validators between the LLM and a mutation (positive amounts, unknown-currency fallback, action/entity allowlists, date-shape coercion).
- `features/{expenses,categories}/schemas.test.ts` — the `makeX(t)` form/CSV factories shared by web + mobile. `t` is stubbed to echo the message key, which also lets assertions check *which* validation fired.

Two behaviors worth knowing (both pinned as tests):
- Zod's `.uuid()` enforces RFC-4122 variant bits — a naive `1111…1111` string is **not** a valid uuid.
- `exportToolInputSchema` validates date **shape only** (`YYYY-MM-DD`); a digit-shaped-but-calendar-invalid date like `2026-13-99` passes through to downstream parsing.

### Adding a unit test

Drop a `<name>.test.ts` next to the source file. To add Vitest to a package that doesn't have it yet: `pnpm --filter @rinciku/<pkg> add -D vitest`, add a `vitest.config.ts` (copy an existing one), and a `"test": "vitest run"` script. Turborepo's `test` task picks it up automatically.

---

## Database tests (pgTAP)

Because clients (including the client-side AI agent loop) talk to Supabase directly, **RLS is the authorization layer** — not app code. These tests are the only thing that catches a leaked-data policy bug, since app testing always runs as a single user. They also guard the hand-maintained grants (`supabase/schemas/95_grants.sql`) that `supabase db diff` cannot regenerate.

Suites live in `supabase/tests/`:

- `00_rls_enabled.sql` — schema-wide invariants: RLS enabled on every `public` table; every table has a policy (with an explicit allowlist for deny-all-by-design tables like `rate_limit_hits`); `anon` holds **zero** table privileges; `authenticated` cannot `truncate`/`references`/`trigger`.
- `01_rls_isolation.sql` — two-user (Alice/Bob) isolation across all core value tables: Bob can't see, spoof-insert, update, or delete Alice's rows. Includes the regression test for the messages-into-another-user's-conversation hole (see below).

Setup runs as `postgres` (RLS-exempt); assertions run as each user by setting `request.jwt.claims` + `set local role authenticated`, mirroring how PostgREST executes queries.

### Regression on record: messages insert (2026-07-14)

`01_rls_isolation.sql` found that the `messages: insert own` policy only checked `user_id`. The FK to `conversations` runs as the table owner and bypasses that table's RLS, so any authenticated user could append rows to **another user's** thread. Fixed by requiring ownership of the target conversation in the insert policy (migration `20260714090147_harden_messages_insert_policy.sql`). This is the exact class of bug single-user manual testing never surfaces.

### Adding a database test

Add a `NN_<name>.sql` file to `supabase/tests/` following the `begin; … plan(N); … finish(); rollback;` pattern. Every test rolls back, so they don't pollute the local DB. Bump the `plan(N)` count to match your assertions.

---

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR, as two jobs:

- **check** — `turbo run typecheck lint build test`. Fast, cached, no external services. Unit tests gate here.
- **database** — sets up the Supabase CLI, runs `supabase start`, then `supabase test db`. Heavier (boots Docker + Postgres), kept separate so the fast feedback loop stays fast.

---

## What to test where

The rule: test where failure is invisible or irreversible; lean on runtime verification for the rest.

| Concern | How | Why here |
| --- | --- | --- |
| Money / date math | Vitest (`packages/core`) | wrong output is silent — no crash to notice |
| Shared validation & AI write gate | Vitest (`packages/domain`) | one test protects web + mobile; the gate stops silent mutations |
| Tenant isolation / grants | pgTAP (`supabase/tests`) | RLS is the auth layer; single-user testing can't catch a leak |
| Core web user journeys | manual / the `verify` skill (Playwright) | broken flows announce themselves; full E2E not yet worth the upkeep |

---

## Not tested yet

Deliberately deferred — revisit as the product and team grow:

- **E2E (Playwright)** — the `verify` skill drives the real web app against local Supabase on demand; there is no committed always-on E2E suite.
- **`create<Feature>Api` integration tests** — the domain factories are thin Supabase wrappers; mocking the client tests the mock. Real coverage would run them against the local stack with a seeded user (also exercises RLS + generated types). Worth adding when the query logic grows.
- **Edge functions** (`supabase/functions/*`) — `delete-account` (destructive) and `ai-chat` (JWT/CORS/rate-limit) warrant Deno tests with the upstream LLM mocked.
- **Web/mobile UI** — no component or snapshot tests; screens churn too fast for the catch rate. A small Maestro smoke suite (login, add expense, view dashboard) is a reasonable post-launch mobile addition.
