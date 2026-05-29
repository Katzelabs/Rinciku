-- Rinciku v1 baseline schema.
-- Source of truth: docs/schema.md. Any drift between this file and the doc
-- should be resolved in favor of the doc; this migration encodes §3–§12.

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- Shared helper: bump updated_at on every UPDATE
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Tables (created without circular FKs first; cross-FKs added at the bottom)
-- ============================================================================

-- §3 profiles ----------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  display_name        text,
  base_currency       text         not null default 'IDR'
    check (base_currency in ('IDR','USD')),
  monthly_income_idr  numeric(15,2) not null default 0,
  monthly_income_usd  numeric(15,2) not null default 0,
  month_start_day     smallint     not null default 1
    check (month_start_day between 1 and 28),
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

-- §4 categories --------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  tier        text        not null check (tier in ('fixed','needs','wants')),
  icon        text,
  color       text        check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order  int         not null default 0,
  is_archived boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, name)
);

-- §5 essentials --------------------------------------------------------------
create table public.essentials (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid          not null references auth.users(id) on delete cascade,
  category_id      uuid          references public.categories(id) on delete set null,
  name             text          not null,
  estimated_amount numeric(15,2) not null check (estimated_amount >= 0),
  currency         text          not null check (currency in ('IDR','USD')),
  is_active        boolean       not null default true,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

-- §6 expenses ----------------------------------------------------------------
-- attachment_id FK added below (circular with expense_attachments).
create table public.expenses (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid          not null references auth.users(id) on delete cascade,
  category_id           uuid          references public.categories(id) on delete set null,
  amount                numeric(15,2) not null check (amount > 0),
  currency              text          not null check (currency in ('IDR','USD')),
  exchange_rate_to_idr  numeric(18,8) not null,
  amount_idr            numeric(15,2) generated always as (round(amount * exchange_rate_to_idr, 2)) stored,
  occurred_at           timestamptz   not null default now(),
  note                  text,
  source                text          not null default 'manual'
    check (source in ('manual','chat','image')),
  attachment_id         uuid,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

-- §7 expense_attachments -----------------------------------------------------
-- expense_id FK added below (circular with expenses).
create table public.expense_attachments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  expense_id         uuid,
  storage_path       text        not null,
  doc_type           text        check (doc_type in ('receipt','transfer','invoice','ewallet','unknown')),
  mime_type          text,
  file_size_bytes    int,
  ai_raw_extraction  jsonb,
  ai_confidence      numeric(3,2) check (ai_confidence between 0 and 1),
  confirmed          boolean     not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- §8 budgets -----------------------------------------------------------------
create table public.budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid          not null references auth.users(id) on delete cascade,
  category_id   uuid          not null references public.categories(id) on delete cascade,
  period_year   smallint      not null check (period_year between 2020 and 2100),
  period_month  smallint      not null check (period_month between 1 and 12),
  amount_idr    numeric(15,2) not null check (amount_idr >= 0),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  unique (user_id, category_id, period_year, period_month)
);

-- §9 conversations -----------------------------------------------------------
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  title           text,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- §10 messages ---------------------------------------------------------------
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  role            text        not null check (role in ('user','assistant','system','tool')),
  content         text        not null,
  attachment_id   uuid        references public.expense_attachments(id) on delete set null,
  model           text,
  tokens_input    int,
  tokens_output   int,
  created_at      timestamptz not null default now()
);

-- ============================================================================
-- Circular FKs (§6 ↔ §7)
-- ============================================================================

alter table public.expenses
  add constraint expenses_attachment_id_fkey
  foreign key (attachment_id) references public.expense_attachments(id)
  on delete set null;

alter table public.expense_attachments
  add constraint expense_attachments_expense_id_fkey
  foreign key (expense_id) references public.expenses(id)
  on delete cascade;

-- ============================================================================
-- Indexes (§13)
-- ============================================================================

create index categories_user_id_idx               on public.categories (user_id);
create index categories_user_tier_sort_idx        on public.categories (user_id, tier, sort_order);

create index essentials_user_id_idx               on public.essentials (user_id);
create index essentials_user_active_idx           on public.essentials (user_id, is_active);

create index expenses_user_id_idx                 on public.expenses (user_id);
create index expenses_user_occurred_at_idx        on public.expenses (user_id, occurred_at desc);
create index expenses_user_category_idx           on public.expenses (user_id, category_id);
create index expenses_user_source_idx             on public.expenses (user_id, source);

create index expense_attachments_user_id_idx      on public.expense_attachments (user_id);
create index expense_attachments_user_confirmed_idx
                                                  on public.expense_attachments (user_id, confirmed);
create index expense_attachments_expense_id_idx   on public.expense_attachments (expense_id);

create index budgets_user_id_idx                  on public.budgets (user_id);
create index budgets_user_period_idx              on public.budgets (user_id, period_year, period_month);

create index conversations_user_last_message_idx
  on public.conversations (user_id, last_message_at desc nulls last);

create index messages_conversation_created_idx    on public.messages (conversation_id, created_at);
create index messages_user_id_idx                 on public.messages (user_id);

-- ============================================================================
-- updated_at triggers (every mutable table; messages is immutable)
-- ============================================================================

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.essentials
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.expense_attachments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row-level security
-- ============================================================================

-- profiles (id, not user_id; no delete policy — cascades from auth.users)
alter table public.profiles enable row level security;
create policy "profiles: select own" on public.profiles for select to authenticated
  using ( id = (select auth.uid()) );
create policy "profiles: insert own" on public.profiles for insert to authenticated
  with check ( id = (select auth.uid()) );
create policy "profiles: update own" on public.profiles for update to authenticated
  using ( id = (select auth.uid()) )
  with check ( id = (select auth.uid()) );

-- categories
alter table public.categories enable row level security;
create policy "categories: select own" on public.categories for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "categories: insert own" on public.categories for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "categories: update own" on public.categories for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "categories: delete own" on public.categories for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- essentials
alter table public.essentials enable row level security;
create policy "essentials: select own" on public.essentials for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "essentials: insert own" on public.essentials for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "essentials: update own" on public.essentials for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "essentials: delete own" on public.essentials for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- expenses
alter table public.expenses enable row level security;
create policy "expenses: select own" on public.expenses for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "expenses: insert own" on public.expenses for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "expenses: update own" on public.expenses for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "expenses: delete own" on public.expenses for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- expense_attachments
alter table public.expense_attachments enable row level security;
create policy "expense_attachments: select own" on public.expense_attachments for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "expense_attachments: insert own" on public.expense_attachments for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "expense_attachments: update own" on public.expense_attachments for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "expense_attachments: delete own" on public.expense_attachments for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- budgets
alter table public.budgets enable row level security;
create policy "budgets: select own" on public.budgets for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "budgets: insert own" on public.budgets for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "budgets: update own" on public.budgets for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "budgets: delete own" on public.budgets for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- conversations
alter table public.conversations enable row level security;
create policy "conversations: select own" on public.conversations for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "conversations: insert own" on public.conversations for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "conversations: update own" on public.conversations for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "conversations: delete own" on public.conversations for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- messages
alter table public.messages enable row level security;
create policy "messages: select own" on public.messages for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "messages: insert own" on public.messages for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "messages: update own" on public.messages for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "messages: delete own" on public.messages for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- ============================================================================
-- Storage — expense-attachments bucket (§11)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-attachments',
  'expense-attachments',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic']
)
on conflict (id) do nothing;

create policy "expense-attachments: select own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'expense-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "expense-attachments: insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'expense-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "expense-attachments: update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'expense-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "expense-attachments: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'expense-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ============================================================================
-- handle_new_user — auto-create profile + seed default categories (§12)
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.categories (user_id, name, tier, icon, color, sort_order) values
    (new.id, 'rent',          'fixed', 'home',          '#7a8d6a', 0),
    (new.id, 'internet',      'fixed', 'wifi',          '#7a8d6a', 1),
    (new.id, 'electricity',   'fixed', 'plug-zap',      '#7a8d6a', 2),
    (new.id, 'water',         'fixed', 'droplets',      '#7a8d6a', 3),
    (new.id, 'groceries',     'needs', 'shopping-cart', '#a3a86b', 0),
    (new.id, 'transport',     'needs', 'bus',           '#a3a86b', 1),
    (new.id, 'health',        'needs', 'heart-pulse',   '#a3a86b', 2),
    (new.id, 'dining out',    'wants', 'utensils',      '#c4a86b', 0),
    (new.id, 'subscriptions', 'wants', 'credit-card',   '#c4a86b', 1),
    (new.id, 'entertainment', 'wants', 'gamepad-2',     '#c4a86b', 2);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
