# Rinciku — Database Schema

> Source of truth for Supabase Postgres tables, RLS policies, storage, helpers, and indexes for the Rinciku MVP. All future migrations and feature `api.ts` files should match this contract.

**Stack:** Supabase (PostgreSQL 17 + Auth + RLS + Storage). Project id: `rinciku`. See `supabase/config.toml`.

---

## Table of contents

1. [Overview & conventions](#1-overview--conventions)
2. [Entity diagram](#2-entity-diagram)
3. [`profiles`](#3-profiles) — per-user profile + monthly cycle config
4. [`tiers`](#4-tiers) — user-defined spending tiers (`is_essential` flag)
4a. [`categories`](#4a-categories) — spending categories, each pointing at a tier
4b. [`income_categories`](#4b-income_categories) — flat income source taxonomy (no tier)
5. [`essentials`](#5-essentials) — monthly non-negotiable line items
6. [`expenses`](#6-expenses) — core transaction table
7. [`expense_attachments`](#7-expense_attachments) — AI-extracted document metadata
8. [`incomes`](#8-incomes) — manual income log (parallel to expenses)
9. [`income_attachments`](#9-income_attachments) — AI-extracted income document metadata
10. [`budgets`](#10-budgets) — monthly snapshot per category per month
11. [`conversations`](#11-conversations) — AI chat threads
12. [`messages`](#12-messages) — chat messages with token accounting
13. [Storage — attachment buckets](#13-storage--attachment-buckets)
14. [Helper functions & triggers](#14-helper-functions--triggers)
15. [Indexes summary](#15-indexes-summary)
16. [Out of scope (v1)](#16-out-of-scope-v1)

When working on a single table, use `Read(offset, limit)` to jump to its section instead of loading the whole file.

---

## 1. Overview & conventions

### Naming
- Schema: everything app-facing lives in `public`. Auth lives in `auth` (managed by Supabase).
- Tables: `snake_case`, plural (`expenses`, not `expense`).
- Columns: `snake_case`.
- Policies: `"<table>: <action> own"` (e.g. `"expenses: select own"`).
- Triggers: `<verb>_<entity>` (e.g. `set_updated_at`, `handle_new_user`).

### Primary keys
- `uuid` with `default gen_random_uuid()`.
- Exception: `profiles.id` is `uuid` referencing `auth.users(id)` (1:1 with the auth row).

### Timestamps
- `created_at timestamptz not null default now()` on every row.
- `updated_at timestamptz not null default now()` on every mutable row, kept fresh by the shared `set_updated_at()` trigger.
- All timestamps stored UTC; convert in the app.

### Money & currency
- Amounts: `numeric(15, 2)`.
- Currency codes: text + `CHECK (currency in (...))` rather than a Postgres enum, so adding a new currency later does not require an `ALTER TYPE`.
- Allow-list (replicated on every `currency` / `*_currency` column):
  `'IDR','USD','EUR','JPY','GBP','SGD','MYR','AUD','CAD','CNY','KRW','HKD','THB','PHP','INR','VND'`.
- Base currency is picked by the user at onboarding and **changeable in settings** (see `auth/06-base-currency-rewire.md` for the settings UX + base-change confirmation modal).
- Every transactional row (`expenses`, `essentials`, `budgets`) writes `(amount, currency)` in the **base in effect at write time**. Historical rows are not retroactively rewritten when the user changes base later — their `currency` field preserves the base that was active when the row was logged.
- FX conversion happens at read time via a JS rate map in `src/lib/fx.ts`. The map is fetched live from `open.er-api.com` (no API key, daily updates), cached in `localStorage` under `rinciku.fx.v1` with a 24h TTL, and falls back to a frozen 2026-06-09 stub when the network and cache both miss. The dashboard SQL function `dashboard_monthly_summary(p_start_at, p_end_at, p_base, p_rates)` aggregates by `sum(amount * (p_rates ->> currency)::numeric)`, pivoting per-row through IDR — its `p_rates` jsonb argument is whatever `src/lib/fx.ts` resolved at call time.

### Enums-as-text
Same reasoning as currency. Applies to:
- `expense_attachments.doc_type` — `'receipt' | 'transfer' | 'invoice' | 'ewallet' | 'unknown'`
- `expenses.source` — `'manual' | 'chat' | 'image'`
- `messages.role` — `'user' | 'assistant' | 'system' | 'tool'`

### Deletes
- Hard delete only in v1 (no soft delete column).
- FK from any user-owned table to `auth.users(id)` uses `on delete cascade` so deleting an auth user wipes their data.
- Within `public`, FKs cascade when the child cannot exist without the parent (e.g. `messages.conversation_id`), and `on delete set null` when the child should survive (e.g. `expenses.category_id` if a category is deleted).

### RLS — canonical pattern
RLS is **enabled on every `public` table**. Every user-owned table follows this pattern; deviations are called out per table.

```sql
alter table public.<t> enable row level security;

create policy "<t>: select own"
  on public.<t> for select to authenticated
  using ( user_id = (select auth.uid()) );

create policy "<t>: insert own"
  on public.<t> for insert to authenticated
  with check ( user_id = (select auth.uid()) );

create policy "<t>: update own"
  on public.<t> for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

create policy "<t>: delete own"
  on public.<t> for delete to authenticated
  using ( user_id = (select auth.uid()) );
```

Why `(select auth.uid())` not `auth.uid()` — Postgres treats the subselect as an initplan and evaluates it once per query instead of once per row. This is the Supabase-recommended pattern and a meaningful win on large `expenses` scans.

`anon` role has no policies — anonymous users see nothing.
`service_role` bypasses RLS — use only from server-side / Edge Functions for admin tasks (seeding, backfill).

### Indexing rules
- Every `user_id` column gets a btree index (RLS injects it into every `WHERE`).
- Every foreign key column gets an index (avoid sequential scans on cascade / join).
- Hot query paths get a composite index (e.g. `expenses (user_id, occurred_at desc)`).
- Full list in [§15 Indexes summary](#15-indexes-summary).

### Generated columns
`expenses.amount_idr` is a `GENERATED ALWAYS AS ... STORED` column so dashboard aggregations never recompute the FX conversion. Stored generated columns are indexable and back-fill on insert without trigger logic.

---

## 2. Entity diagram

```
auth.users  (managed by Supabase)
   │ 1:1
   ▼
profiles
   │
   │  (user_id on every owned table below)
   ▼
categories ──┐
   │         │
   ▼         ▼
essentials   budgets                conversations
                                       │ 1:N
                                       ▼
                                    messages
expenses ◀────────┐                    │
   │              │                    │
   │ 1:1 (nullable both ways)          │
   ▼              │                    │
expense_attachments ◀──────────────────┘
                  (messages.attachment_id, nullable)

income_categories ─┐
                   ▼
incomes ◀─────────┐
   │              │
   │ 1:1 (nullable both ways)
   ▼              │
income_attachments
```

Notes:
- `expenses` ↔ `expense_attachments` is **circular**: an expense has an optional `attachment_id`; an attachment has an optional `expense_id`. Resolution flow is in [§7](#7-expense_attachments).
- `incomes` ↔ `income_attachments` is the same circular pattern — see [§9](#9-income_attachments).
- `messages.attachment_id` lets a chat message reference the original uploaded image (e.g. "here is the receipt") before the user confirms it into an expense.

---

## 3. `profiles`

1:1 with `auth.users`. Holds onboarding profile + monthly-cycle config used by the dashboard and AI.

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | `references auth.users(id) on delete cascade` |
| `email` | `text` | mirrored from `auth.users.email` at signup |
| `display_name` | `text` | nullable; user fills during onboarding |
| `base_currency` | `text not null default 'IDR'` | `check (base_currency in (<16 codes>))` — see [§1](#money--currency). Changeable in settings. |
| `expected_monthly_income` | `numeric(15,2) not null default 0` | `check (>= 0)` — gross monthly income in `expected_monthly_income_currency`. `0` for variable-income users; dashboard hides the "expected baseline" widget in that case. |
| `expected_monthly_income_currency` | `text not null default 'IDR'` | `check (... in (<16 codes>))` — the base in effect when the income was last set. Does not auto-update when `base_currency` changes; dashboard converts at read time via `convertToBase`. |
| `month_start_day` | `smallint not null default 1` | `check (between 1 and 28)` — day of month the budget cycle resets |
| `onboarded_at` | `timestamptz` | nullable; set to `now()` when the onboarding form is submitted. The `<RequireOnboarded>` route guard redirects to `/onboarding` while this is null. |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | maintained by `set_updated_at` trigger |

### Constraints
- `pk (id)`
- `fk (id) -> auth.users(id) on delete cascade`

### Indexes
None beyond PK. Lookups are always by `id = auth.uid()`.

### RLS
Standard pattern, but the column is `id` not `user_id`:

```sql
create policy "profiles: select own" on public.profiles for select to authenticated
  using ( id = (select auth.uid()) );
create policy "profiles: insert own" on public.profiles for insert to authenticated
  with check ( id = (select auth.uid()) );
create policy "profiles: update own" on public.profiles for update to authenticated
  using ( id = (select auth.uid()) ) with check ( id = (select auth.uid()) );
-- No delete policy: profile is removed when auth.users cascades.
```

### Lifecycle
- Auto-inserted by [`handle_new_user`](#handle_new_user) trigger on `auth.users` insert.
- App should never INSERT directly; only UPDATE the row after signup.

---

## 4. `tiers`

Per-user, **free-form** spending tiers. Replaces the old hardcoded `fixed|needs|wants` enum on `categories`: users name, color, order, and delete their own tiers. The `is_essential` flag drives the dashboard baseline-covered math (see [`dashboard_monthly_summary`](#14-helper-functions--triggers) and `src/features/dashboard/api.ts`) — spending in essential tiers is what counts against the essentials baseline. Seeded with three defaults on signup.

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | `default gen_random_uuid()` |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `name` | `text not null` | user label, e.g. `'Fixed'`, `'Fun money'` |
| `color` | `text` | hex `#rrggbb`; `check (color ~ '^#[0-9a-fA-F]{6}$')` |
| `is_essential` | `boolean not null default false` | counts toward the essentials baseline-covered math |
| `sort_order` | `int not null default 0` | display order |
| `is_archived` | `boolean not null default false` | hide without deleting |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `unique (user_id, name)` — one tier per name per user
- `fk (user_id) -> auth.users(id) on delete cascade`

### Indexes
- `tiers (user_id)` — RLS
- `tiers (user_id, sort_order)` — ordered picker / card list

### RLS
Standard pattern on `user_id`.

### Default seed (created by `handle_new_user`)
- **Fixed** (`is_essential = true`, sort 0)
- **Needs** (`is_essential = true`, sort 1)
- **Wants** (`is_essential = false`, sort 2)

Flagging Fixed + Needs essential preserves the old "fixed + needs = essentials" behavior out of the box.

---

## 4a. `categories`

Per-user spending categories, each pointing at a [tier](#4-tiers). Seeded with defaults on signup so first-run UX has something to log against.

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | `default gen_random_uuid()` |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `name` | `text not null` | e.g. `'rent'`, `'groceries'` |
| `tier_id` | `uuid` | `references tiers(id) on delete set null` — nullable; a category whose tier is deleted becomes "Untiered" rather than blocking the delete |
| `icon` | `text` | lucide icon name, e.g. `'home'` |
| `color` | `text` | hex `#rrggbb`; `check (color ~ '^#[0-9a-fA-F]{6}$')` |
| `sort_order` | `int not null default 0` | display order within its tier |
| `is_archived` | `boolean not null default false` | hide from pickers without breaking historical expenses |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `unique (user_id, name)` — one category per name per user; archived rows still count
- `fk (user_id) -> auth.users(id) on delete cascade`
- `fk (tier_id) -> tiers(id) on delete set null`

### Indexes
- `categories (user_id)` — RLS
- `categories (user_id, tier_id, sort_order)` — sidebar / picker queries

### RLS
Standard pattern on `user_id`.

### Default seed (created by `handle_new_user`)
- **Fixed:** rent, internet, electricity, water
- **Needs:** groceries, transport, health
- **Wants:** dining out, subscriptions, entertainment

Colors and icons are chosen by the seeder; not encoded here so they can evolve without a schema change.

---

## 4b. `income_categories`

Per-user **income source taxonomy** (e.g. Salary, Freelance, Investment). Flat — unlike spending [`categories`](#4a-categories) there is no tier, because tiers carry the `is_essential` baseline math that is meaningless for income. Referenced by [`incomes.source_id`](#8-incomes). Seeded with defaults on signup.

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | `default gen_random_uuid()` |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `name` | `text not null` | e.g. `'Salary'`, `'Freelance'` |
| `icon` | `text` | PascalCase lucide icon name, e.g. `'Banknote'` (see `src/features/categories/lib/icons.ts`) |
| `color` | `text` | hex `#rrggbb`; `check (color ~ '^#[0-9a-fA-F]{6}$')` |
| `sort_order` | `int not null default 0` | display order |
| `is_archived` | `boolean not null default false` | hide from pickers without breaking historical incomes |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `unique (user_id, name)` — one income category per name per user; archived rows still count
- `fk (user_id) -> auth.users(id) on delete cascade`

### Indexes
- `income_categories (user_id)` — RLS
- `income_categories (user_id, sort_order)` — ordered picker / card list

### RLS
Standard pattern on `user_id`.

### Default seed (created by `handle_new_user`)
**Salary, Freelance, Investment, Other** — icons `Banknote / Briefcase / TrendingUp / Wallet`.

---

## 5. `essentials`

Monthly non-negotiable line items that power the "baseline cost of living" the AI consults against.

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `category_id` | `uuid` | `references categories(id) on delete set null` — keep the essential if its category is deleted |
| `name` | `text not null` | e.g. `'rent'`, `'rice 5kg'` |
| `estimated_amount` | `numeric(15,2) not null` | `check (estimated_amount >= 0)` |
| `currency` | `text not null` | `check (currency in (<16 codes>))` — the base in effect when this essential was logged |
| `is_active` | `boolean not null default true` | drop from this month's baseline without deleting history |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `fk (user_id) -> auth.users(id) on delete cascade`
- `fk (category_id) -> categories(id) on delete set null`

### Indexes
- `essentials (user_id)` — RLS
- `essentials (user_id, is_active)` — baseline aggregation queries

### RLS
Standard pattern on `user_id`.

### Notes
- Essentials are templates, not transactions. They are summed (each row converted to the user's current base via `convertToBase`) to produce the monthly baseline.
- Non-base-currency essentials (legacy rows written under a previous base) convert using the current FX rate map at read time, not a snapshot — the baseline is a forward-looking estimate.

---

## 6. `expenses`

The core transaction table. Every spending event lands here.

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `category_id` | `uuid` | `references categories(id) on delete set null` — keep the expense if its category is deleted (becomes "uncategorized") |
| `amount` | `numeric(15,2) not null` | `check (amount > 0)` — entered amount in the base in effect at write time |
| `currency` | `text not null` | `check (currency in (<16 codes>))` — the base in effect when this row was written |
| `occurred_at` | `timestamptz not null default now()` | when the spending happened (may differ from `created_at`) |
| `note` | `text` | freeform memo |
| `source` | `text not null default 'manual'` | `check (source in ('manual','chat','image'))` — provenance |
| `attachment_id` | `uuid` | `references expense_attachments(id) on delete set null` — see circular FK note below |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `fk (user_id) -> auth.users(id) on delete cascade`
- `fk (category_id) -> categories(id) on delete set null`
- `fk (attachment_id) -> expense_attachments(id) on delete set null`

### Indexes
- `expenses (user_id)` — RLS
- `expenses (user_id, occurred_at desc)` — dashboard timeline / "this month" queries
- `expenses (user_id, category_id)` — per-category aggregation
- `expenses (user_id, source)` — analytics on chat vs image vs manual

### RLS
Standard pattern on `user_id`.

### Circular FK with `expense_attachments`
`expenses.attachment_id` and `expense_attachments.expense_id` reference each other. Migration strategy: create both tables without the cross-FKs, then `ALTER TABLE ... ADD CONSTRAINT` afterwards. Both ends are nullable and both use `on delete set null` (with `expense_attachments.expense_id` cascading — see [§7](#7-expense_attachments)) so deleting either side leaves the other in a consistent state.

### Row shape note
With the base-currency model, the form always writes `amount` in the user's current `base_currency`. There is no per-row exchange rate snapshot anymore: when a user changes their base later, historical rows are reconverted at read time via the runtime FX rate map (see [§1](#money--currency) and `dashboard_monthly_summary`). This trades reproducible historical totals for a single-source-of-truth amount that no longer drifts apart from `amount * rate`.

---

## 7. `expense_attachments`

Uploaded document + Claude Vision extraction metadata. May exist before an expense is created (image-logging flow: upload → AI extracts → user reviews → expense created → link).

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `expense_id` | `uuid` | `references expenses(id) on delete cascade` — nullable until the user confirms the extraction |
| `storage_path` | `text not null` | matches `{user_id}/{year}-{month}/{uuid}.{ext}` in the `expense-attachments` bucket |
| `doc_type` | `text` | `check (doc_type in ('receipt','transfer','invoice','ewallet','unknown'))` |
| `mime_type` | `text` | e.g. `'image/jpeg'` |
| `file_size_bytes` | `int` | |
| `ai_raw_extraction` | `jsonb` | full Claude Vision response — keep for debugging and reprocessing |
| `ai_confidence` | `numeric(3,2)` | `check (ai_confidence between 0 and 1)` |
| `confirmed` | `boolean not null default false` | true once the user accepts the extraction into an expense |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `fk (user_id) -> auth.users(id) on delete cascade`
- `fk (expense_id) -> expenses(id) on delete cascade` — added via `ALTER TABLE` after both tables exist (circular FK)

### Indexes
- `expense_attachments (user_id)` — RLS
- `expense_attachments (user_id, confirmed)` — surface pending uploads in chat UI
- `expense_attachments (expense_id)` — reverse lookup from an expense

### RLS
Standard pattern on `user_id`. Inserts with `expense_id = null` are allowed — the pre-confirmation upload step is normal.

### Linking flow (image-logging)
1. App uploads file to `expense-attachments` bucket at `{user_id}/{YYYY}-{MM}/{uuid}.{ext}`.
2. App inserts `expense_attachments` row with `storage_path`, `expense_id = null`, `confirmed = false`. Calls Edge Function to run Claude Vision; updates `ai_raw_extraction`, `doc_type`, `ai_confidence`.
3. User reviews extracted fields in chat, edits if needed, taps confirm.
4. App inserts `expenses` row with `attachment_id = <the attachment id>` and the corrected fields.
5. App updates the attachment with `expense_id = <new expense id>`, `confirmed = true`.

### Cleanup
Deleting an `expense_attachments` row does **not** delete the underlying storage object. App must call `storage.from('expense-attachments').remove([path])` first, then delete the row. (A v2 trigger or Edge Function can automate this.)

---

## 8. `incomes`

Manual income log. Parallel to `expenses`. Each income optionally points at a flat [`income_categories`](#4b-income_categories) source via `source_id` (multi-source *templates* — recurring "salary in USD + side gig in IDR" definitions — remain v2; see [§16](#16-out-of-scope-v1)). Every received-money event lands here so the dashboard can sum **received this cycle** alongside the `profiles.expected_monthly_income` baseline.

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `source_id` | `uuid` | `references income_categories(id) on delete set null` — nullable; deleting a source leaves the income intact but uncategorized (mirrors `expenses.category_id`) |
| `amount` | `numeric(15,2) not null` | `check (amount > 0)` — entered amount in the base in effect at write time |
| `currency` | `text not null` | `check (currency in (<16 codes>))` — the base in effect when this row was written |
| `occurred_at` | `timestamptz not null default now()` | when the income was received |
| `note` | `text` | freeform memo (e.g. "May salary", "side gig invoice #42") |
| `source` | `text not null default 'manual'` | `check (source in ('manual','chat','image'))` — provenance |
| `attachment_id` | `uuid` | `references income_attachments(id) on delete set null` — see circular FK note below |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `fk (user_id) -> auth.users(id) on delete cascade`
- `fk (source_id) -> income_categories(id) on delete set null`
- `fk (attachment_id) -> income_attachments(id) on delete set null`

### Indexes
- `incomes (user_id)` — RLS
- `incomes (user_id, occurred_at desc)` — dashboard timeline / "this month" queries
- `incomes (user_id, source)` — analytics on chat vs image vs manual
- `incomes (user_id, source_id)` — per-source aggregation

### RLS
Standard pattern on `user_id`.

### Circular FK with `income_attachments`
Identical pattern to `expenses` ↔ `expense_attachments` — see [§6](#6-expenses) and [§9](#9-income_attachments). Both ends nullable; the FK on `incomes.attachment_id` uses `on delete set null`, the FK on `income_attachments.income_id` cascades.

---

## 9. `income_attachments`

Uploaded document + (eventually) Claude Vision extraction metadata. Identical shape to `expense_attachments` — same `doc_type` allow-list kept on purpose so the AI extraction pipeline can be polymorphic across both tables. May exist before an income is created (image-logging flow: upload → AI extracts → user reviews → income created → link).

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `income_id` | `uuid` | `references incomes(id) on delete cascade` — nullable until the user confirms the extraction |
| `storage_path` | `text not null` | matches `{user_id}/{year}-{month}/{uuid}.{ext}` in the `income-attachments` bucket |
| `doc_type` | `text` | `check (doc_type in ('receipt','transfer','invoice','ewallet','unknown'))` — kept identical to expense_attachments |
| `mime_type` | `text` | e.g. `'image/jpeg'`, `'application/pdf'` |
| `file_size_bytes` | `int` | |
| `ai_raw_extraction` | `jsonb` | full Claude Vision response |
| `ai_confidence` | `numeric(3,2)` | `check (ai_confidence between 0 and 1)` |
| `confirmed` | `boolean not null default false` | true once the user accepts the extraction into an income |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `fk (user_id) -> auth.users(id) on delete cascade`
- `fk (income_id) -> incomes(id) on delete cascade` — added via `ALTER TABLE` after both tables exist (circular FK)

### Indexes
- `income_attachments (user_id)` — RLS
- `income_attachments (user_id, confirmed)` — surface pending uploads in chat UI
- `income_attachments (income_id)` — reverse lookup from an income

### RLS
Standard pattern on `user_id`. Inserts with `income_id = null` are allowed — the pre-confirmation upload step is normal.

### Cleanup
Same caveat as `expense_attachments`: deleting a row does **not** delete the underlying storage object. App must call `storage.from('income-attachments').remove([path])` first, then delete the row.

---

## 10. `budgets`

Monthly snapshot per category per month. One row per `(user_id, category_id, period_year, period_month)`.

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `category_id` | `uuid not null` | `references categories(id) on delete cascade` — a budget without its category is meaningless |
| `period_year` | `smallint not null` | `check (between 2020 and 2100)` |
| `period_month` | `smallint not null` | `check (between 1 and 12)` |
| `amount` | `numeric(15,2) not null` | `check (amount >= 0)` — the budget target in `currency` |
| `currency` | `text not null` | `check (currency in (<16 codes>))` — the base in effect when this budget was set |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `unique (user_id, category_id, period_year, period_month)` — one target per category per month
- `fk (user_id) -> auth.users(id) on delete cascade`
- `fk (category_id) -> categories(id) on delete cascade`

### Indexes
- `budgets (user_id)` — RLS
- `budgets (user_id, period_year, period_month)` — "show me this month's budgets" query

### RLS
Standard pattern on `user_id`.

### Notes
- Snapshot-per-month gives a historical record: "I budgeted Rp 2M for groceries in March, spent Rp 2.4M; for April I raised it to Rp 2.5M."
- App seeds the next month's budgets by copying from the current month (UX choice, not enforced in schema).
- Stored in whatever base was active at write time; aggregations convert at read time via `convertToBase`.

---

## 11. `conversations`

One row per AI chat thread. Each thread is a sequence of [`messages`](#12-messages).

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | |
| `user_id` | `uuid not null` | `references auth.users(id) on delete cascade` |
| `title` | `text` | nullable; auto-generated from first user message |
| `last_message_at` | `timestamptz` | denormalized so the sidebar can sort without joining `messages` |
| `created_at`, `updated_at` | `timestamptz` | standard |

### Constraints
- `pk (id)`
- `fk (user_id) -> auth.users(id) on delete cascade`

### Indexes
- `conversations (user_id, last_message_at desc nulls last)` — sidebar list

### RLS
Standard pattern on `user_id`.

### Notes
- `last_message_at` is updated by the app (or an `after insert` trigger on `messages` — TBD; not critical for v1).

---

## 12. `messages`

One row per message. Designed for Supabase Realtime row-level subscriptions filtered by `conversation_id`.

### Columns

| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | |
| `conversation_id` | `uuid not null` | `references conversations(id) on delete cascade` |
| `user_id` | `uuid not null` | denormalized from `conversations` so RLS can match without a join — `references auth.users(id) on delete cascade` |
| `role` | `text not null` | `check (role in ('user','assistant','system','tool'))` |
| `content` | `text not null` | plain text from Claude. If we need rich blocks (images, tool_use), migrate to `jsonb`. |
| `attachment_id` | `uuid` | `references expense_attachments(id) on delete set null` — for "here is the receipt" messages |
| `model` | `text` | e.g. `'claude-sonnet-4-20250514'`; null for user messages |
| `tokens_input` | `int` | null for user messages |
| `tokens_output` | `int` | null for user messages |
| `created_at` | `timestamptz not null default now()` | no `updated_at` — messages are immutable |

### Constraints
- `pk (id)`
- `fk (conversation_id) -> conversations(id) on delete cascade`
- `fk (user_id) -> auth.users(id) on delete cascade`
- `fk (attachment_id) -> expense_attachments(id) on delete set null`

### Indexes
- `messages (conversation_id, created_at)` — thread playback
- `messages (user_id)` — RLS

### RLS
Standard pattern on `user_id` (not joined through `conversations` — that's why `user_id` is denormalized here).

### Notes
- Token columns let us bill / cap usage later without re-parsing the API response.
- The model id is the **actual** model used when the message was generated, not the user's preference. Pin to the brief's `claude-sonnet-4-20250514` at first, but record whatever was actually called.
- Messages are append-only. Use `on delete cascade` to wipe a conversation's messages when the conversation is deleted; never UPDATE existing message content.

---

## 13. Storage — attachment buckets

Two parallel private buckets, one per transactional family. Bucket configs and RLS policies mirror each other; the only deltas are the bucket id and the allowed mime types.

### Buckets

| bucket | public | size limit | allowed mime types |
|---|---|---|---|
| `expense-attachments` | false | 10 MB (`10485760`) | `image/jpeg`, `image/png`, `image/webp`, `image/heic` |
| `income-attachments`  | false | 10 MB (`10485760`) | `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf` |

PDF is allowed on the income bucket because payslips and invoices commonly arrive as PDFs.

### Path pattern (both buckets)
```
{user_id}/{YYYY}-{MM}/{uuid}.{ext}
```
Example: `8c4f.../2026-05/3b21....jpg`. The first path segment is always the owner's `auth.uid()`, which storage RLS uses for ownership checks.

### RLS on `storage.objects`
Four policies per bucket. All check that the first path segment matches the caller's id. The `income-attachments` policies are an exact mirror of the `expense-attachments` ones, swapping the `bucket_id` literal.

```sql
create policy "expense-attachments: select own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'expense-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
-- ...insert / update / delete follow the same shape, with the matching action.

create policy "income-attachments: select own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'income-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
-- ...insert / update / delete follow the same shape.
```

### Notes
- Use **signed URLs** (`createSignedUrl`) for displaying images — the buckets are private, public URLs will not work.
- Deleting an `expense_attachments` / `income_attachments` row does NOT delete the underlying storage object. App must remove the object first, then the row. (v2: add `after delete` trigger or Edge Function for atomic cleanup.)

---

## 14. Helper functions & triggers

### `public.set_updated_at()`
Generic `BEFORE UPDATE` trigger function that sets `new.updated_at = now()`. Attached to every table with an `updated_at` column.

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Per-table:
create trigger set_updated_at before update on public.<t>
  for each row execute function public.set_updated_at();
```

Attached to: `profiles`, `tiers`, `categories`, `essentials`, `expenses`, `expense_attachments`, `incomes`, `income_attachments`, `budgets`, `conversations`. (Not `messages` — immutable.)

### `public.handle_new_user()`
`AFTER INSERT ON auth.users` trigger. Creates a profile row, seeds 3 default tiers, seeds default categories pointed at those tiers, and seeds 4 default income categories.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fixed uuid;
  v_needs uuid;
  v_wants uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  -- seed default tiers (Fixed/Needs essential, Wants not)
  insert into public.tiers (user_id, name, color, is_essential, sort_order)
    values (new.id, 'Fixed', '#7a8d6a', true, 0) returning id into v_fixed;
  insert into public.tiers (user_id, name, color, is_essential, sort_order)
    values (new.id, 'Needs', '#a3a86b', true, 1) returning id into v_needs;
  insert into public.tiers (user_id, name, color, is_essential, sort_order)
    values (new.id, 'Wants', '#c4a86b', false, 2) returning id into v_wants;

  insert into public.categories (user_id, name, tier_id, icon, color, sort_order) values
    (new.id, 'rent',          v_fixed, 'home',          '#7a8d6a', 0),
    (new.id, 'internet',      v_fixed, 'wifi',          '#7a8d6a', 1),
    (new.id, 'electricity',   v_fixed, 'plug-zap',      '#7a8d6a', 2),
    (new.id, 'water',         v_fixed, 'droplets',      '#7a8d6a', 3),
    (new.id, 'groceries',     v_needs, 'shopping-cart', '#a3a86b', 0),
    (new.id, 'transport',     v_needs, 'bus',           '#a3a86b', 1),
    (new.id, 'health',        v_needs, 'heart-pulse',   '#a3a86b', 2),
    (new.id, 'dining out',    v_wants, 'utensils',      '#c4a86b', 0),
    (new.id, 'subscriptions', v_wants, 'credit-card',   '#c4a86b', 1),
    (new.id, 'entertainment', v_wants, 'gamepad-2',     '#c4a86b', 2);

  -- Flat income source taxonomy (no tier). PascalCase lucide icon names.
  insert into public.income_categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Salary',     'Banknote',   '#7a8d6a', 0),
    (new.id, 'Freelance',  'Briefcase',  '#a3a86b', 1),
    (new.id, 'Investment', 'TrendingUp', '#6b8da3', 2),
    (new.id, 'Other',      'Wallet',     '#8d8d8d', 3);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

`security definer` + `set search_path = ''` is the Supabase-recommended hardening: the function runs with the function-owner's permissions (needed to insert into `public` tables on behalf of a just-created auth user) and cannot be tricked by a malicious search_path.

---

## 15. Indexes summary

Every PK is implicitly indexed. Non-PK indexes:

| index | table | purpose |
|---|---|---|
| `(user_id)` | `tiers` | RLS |
| `(user_id, sort_order)` | `tiers` | ordered picker / card list |
| `(user_id)` | `categories` | RLS |
| `(user_id, tier_id, sort_order)` | `categories` | picker / sidebar |
| `(user_id)` | `income_categories` | RLS |
| `(user_id, sort_order)` | `income_categories` | ordered picker / card list |
| `(user_id)` | `essentials` | RLS |
| `(user_id, is_active)` | `essentials` | baseline aggregation |
| `(user_id)` | `expenses` | RLS |
| `(user_id, occurred_at desc)` | `expenses` | dashboard timeline |
| `(user_id, category_id)` | `expenses` | per-category aggregation |
| `(user_id, source)` | `expenses` | provenance analytics |
| `(user_id)` | `expense_attachments` | RLS |
| `(user_id, confirmed)` | `expense_attachments` | pending uploads |
| `(expense_id)` | `expense_attachments` | reverse lookup |
| `(user_id)` | `incomes` | RLS |
| `(user_id, occurred_at desc)` | `incomes` | dashboard timeline / "received this cycle" |
| `(user_id, source)` | `incomes` | provenance analytics |
| `(user_id, source_id)` | `incomes` | per-source aggregation |
| `(user_id)` | `income_attachments` | RLS |
| `(user_id, confirmed)` | `income_attachments` | pending uploads |
| `(income_id)` | `income_attachments` | reverse lookup |
| `(user_id)` | `budgets` | RLS |
| `(user_id, period_year, period_month)` | `budgets` | "this month's budgets" |
| `(user_id, last_message_at desc nulls last)` | `conversations` | sidebar list |
| `(user_id)` | `messages` | RLS |
| `(conversation_id, created_at)` | `messages` | thread playback |

`profiles` needs no extra indexes — always accessed by PK.

---

## 16. Out of scope (v1)

Documented here so future-Claude does not assume they exist:

- **Server-side FX caching / cross-device rate sync** — v1 fetches `open.er-api.com` from the browser and caches in `localStorage` (see `src/lib/fx.ts`). An Edge Function + Supabase-side rate table would let multiple devices share one fetch per day; only worth doing if we migrate to a keyed source or want stable cross-device totals.
- **`exchange_rates` table** — historical totals reconvert at read time via the runtime rate map; the per-row rate snapshot is gone. A separate rates table (daily timestamped rows) would only be needed if/when we want stable historical totals immune to live-rate movement — v2.
- **Income source *templates*** — a flat income taxonomy now ships as [`income_categories`](#4b-income_categories) (tag each income with a source). What remains v2 is *recurring multi-source templates* — predefined definitions like "salary in USD on the 25th + side gig in IDR" that auto-populate expected income; v1 still has only the single `expected_monthly_income` on `profiles`.
- **Recurring expenses** — listed in PROJECT_BRIEF.md v2 features. Would add a `recurring_expenses` template table + a scheduled job.
- **Savings goals** — v2.
- **Multi-language category names** — v2. Would add a `categories.name_i18n jsonb` column.
- **Soft delete / data retention** — v2 (PROJECT_BRIEF.md mentions user-controlled storage expiry). Would add `deleted_at timestamptz` plus retention policy.
- **Audit log** — not planned. RLS + `created_at`/`updated_at` are sufficient for personal use.
- **Tool-use / rich message content** — `messages.content` is `text` in v1. If/when we add tool calls or image content blocks in chat, migrate `content` to `jsonb` (no schema-breaking change beyond the type swap).

---

*Last updated: 2026-06-19. Migrations: `supabase/migrations/*_init.sql` is the regenerated rolling-init artifact; edit the declarative `supabase/schemas/*.sql` files and regen via `supabase db diff -f init`.*
