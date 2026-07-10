-- §9 conversations

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  title           text,
  last_message_at timestamptz,
  -- Running LLM-generated summary of messages older than the verbatim history
  -- window sent to the model each turn (see @rinciku/domain/ai-chat run-turn).
  summary               text,
  -- How many messages (ascending from the start of the thread) the summary
  -- covers. Messages are immutable + append-only, so a count is a stable anchor.
  summary_message_count int         not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- created_at is the query's tiebreaker for conversations that share a
-- last_message_at (or have none yet), so it belongs in the index.
create index conversations_user_last_message_idx
  on public.conversations (user_id, last_message_at desc nulls last, created_at desc);

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
