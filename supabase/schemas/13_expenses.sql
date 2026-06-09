-- §6 expenses
-- attachment_id FK references expense_attachments — the second half of a
-- circular FK pair. The matching FK lives in 14_expense_attachments.sql.

create table public.expenses (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid          not null references auth.users(id) on delete cascade,
  category_id           uuid          references public.categories(id) on delete set null,
  amount                numeric(15,2) not null check (amount > 0),
  currency              text          not null check (currency in (
    'IDR','USD','EUR','JPY','GBP','SGD','MYR','AUD',
    'CAD','CNY','KRW','HKD','THB','PHP','INR','VND'
  )),
  occurred_at           timestamptz   not null default now(),
  note                  text,
  source                text          not null default 'manual'
    check (source in ('manual','chat','image')),
  attachment_id         uuid,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

create index expenses_user_id_idx          on public.expenses (user_id);
create index expenses_user_occurred_at_idx on public.expenses (user_id, occurred_at desc);
create index expenses_user_category_idx    on public.expenses (user_id, category_id);
create index expenses_user_source_idx      on public.expenses (user_id, source);

create trigger set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

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
