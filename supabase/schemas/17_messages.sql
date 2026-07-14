-- §10 messages
-- Immutable — no updated_at column or trigger.

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

create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index messages_user_id_idx              on public.messages (user_id);

alter table public.messages enable row level security;

create policy "messages: select own" on public.messages for select to authenticated
  using ( user_id = (select auth.uid()) );
-- Insert requires owning BOTH the row and the target conversation. The FK to
-- conversations is checked as table owner (bypassing its RLS), so without the
-- subquery any authenticated user could append rows to another user's thread.
create policy "messages: insert own" on public.messages for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and conversation_id in (
      select id from public.conversations
      where user_id = (select auth.uid())
    )
  );
create policy "messages: update own" on public.messages for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "messages: delete own" on public.messages for delete to authenticated
  using ( user_id = (select auth.uid()) );
