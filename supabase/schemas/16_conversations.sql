-- §9 conversations

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  title           text,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index conversations_user_last_message_idx
  on public.conversations (user_id, last_message_at desc nulls last);

create trigger set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

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
