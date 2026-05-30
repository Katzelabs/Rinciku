
  create table "public"."budgets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "category_id" uuid not null,
    "period_year" smallint not null,
    "period_month" smallint not null,
    "amount_idr" numeric(15,2) not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."budgets" enable row level security;


  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "tier" text not null,
    "icon" text,
    "color" text,
    "sort_order" integer not null default 0,
    "is_archived" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."categories" enable row level security;


  create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text,
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."conversations" enable row level security;


  create table "public"."essentials" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "category_id" uuid,
    "name" text not null,
    "estimated_amount" numeric(15,2) not null,
    "currency" text not null,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."essentials" enable row level security;


  create table "public"."expense_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "expense_id" uuid,
    "storage_path" text not null,
    "doc_type" text,
    "mime_type" text,
    "file_size_bytes" integer,
    "ai_raw_extraction" jsonb,
    "ai_confidence" numeric(3,2),
    "confirmed" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."expense_attachments" enable row level security;


  create table "public"."expenses" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "category_id" uuid,
    "amount" numeric(15,2) not null,
    "currency" text not null,
    "exchange_rate_to_idr" numeric(18,8) not null,
    "amount_idr" numeric(15,2) generated always as (round((amount * exchange_rate_to_idr), 2)) stored,
    "occurred_at" timestamp with time zone not null default now(),
    "note" text,
    "source" text not null default 'manual'::text,
    "attachment_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."expenses" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null,
    "content" text not null,
    "attachment_id" uuid,
    "model" text,
    "tokens_input" integer,
    "tokens_output" integer,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."messages" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "display_name" text,
    "base_currency" text not null default 'IDR'::text,
    "monthly_income_idr" numeric(15,2) not null default 0,
    "monthly_income_usd" numeric(15,2) not null default 0,
    "month_start_day" smallint not null default 1,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;

CREATE UNIQUE INDEX budgets_pkey ON public.budgets USING btree (id);

CREATE UNIQUE INDEX budgets_user_id_category_id_period_year_period_month_key ON public.budgets USING btree (user_id, category_id, period_year, period_month);

CREATE INDEX budgets_user_id_idx ON public.budgets USING btree (user_id);

CREATE INDEX budgets_user_period_idx ON public.budgets USING btree (user_id, period_year, period_month);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE INDEX categories_user_id_idx ON public.categories USING btree (user_id);

CREATE UNIQUE INDEX categories_user_id_name_key ON public.categories USING btree (user_id, name);

CREATE INDEX categories_user_tier_sort_idx ON public.categories USING btree (user_id, tier, sort_order);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE INDEX conversations_user_last_message_idx ON public.conversations USING btree (user_id, last_message_at DESC NULLS LAST);

CREATE UNIQUE INDEX essentials_pkey ON public.essentials USING btree (id);

CREATE INDEX essentials_user_active_idx ON public.essentials USING btree (user_id, is_active);

CREATE INDEX essentials_user_id_idx ON public.essentials USING btree (user_id);

CREATE INDEX expense_attachments_expense_id_idx ON public.expense_attachments USING btree (expense_id);

CREATE UNIQUE INDEX expense_attachments_pkey ON public.expense_attachments USING btree (id);

CREATE INDEX expense_attachments_user_confirmed_idx ON public.expense_attachments USING btree (user_id, confirmed);

CREATE INDEX expense_attachments_user_id_idx ON public.expense_attachments USING btree (user_id);

CREATE UNIQUE INDEX expenses_pkey ON public.expenses USING btree (id);

CREATE INDEX expenses_user_category_idx ON public.expenses USING btree (user_id, category_id);

CREATE INDEX expenses_user_id_idx ON public.expenses USING btree (user_id);

CREATE INDEX expenses_user_occurred_at_idx ON public.expenses USING btree (user_id, occurred_at DESC);

CREATE INDEX expenses_user_source_idx ON public.expenses USING btree (user_id, source);

CREATE INDEX messages_conversation_created_idx ON public.messages USING btree (conversation_id, created_at);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE INDEX messages_user_id_idx ON public.messages USING btree (user_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."budgets" add constraint "budgets_pkey" PRIMARY KEY using index "budgets_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."essentials" add constraint "essentials_pkey" PRIMARY KEY using index "essentials_pkey";

alter table "public"."expense_attachments" add constraint "expense_attachments_pkey" PRIMARY KEY using index "expense_attachments_pkey";

alter table "public"."expenses" add constraint "expenses_pkey" PRIMARY KEY using index "expenses_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."budgets" add constraint "budgets_amount_idr_check" CHECK ((amount_idr >= (0)::numeric)) not valid;

alter table "public"."budgets" validate constraint "budgets_amount_idr_check";

alter table "public"."budgets" add constraint "budgets_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE not valid;

alter table "public"."budgets" validate constraint "budgets_category_id_fkey";

alter table "public"."budgets" add constraint "budgets_period_month_check" CHECK (((period_month >= 1) AND (period_month <= 12))) not valid;

alter table "public"."budgets" validate constraint "budgets_period_month_check";

alter table "public"."budgets" add constraint "budgets_period_year_check" CHECK (((period_year >= 2020) AND (period_year <= 2100))) not valid;

alter table "public"."budgets" validate constraint "budgets_period_year_check";

alter table "public"."budgets" add constraint "budgets_user_id_category_id_period_year_period_month_key" UNIQUE using index "budgets_user_id_category_id_period_year_period_month_key";

alter table "public"."budgets" add constraint "budgets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."budgets" validate constraint "budgets_user_id_fkey";

alter table "public"."categories" add constraint "categories_color_check" CHECK ((color ~ '^#[0-9a-fA-F]{6}$'::text)) not valid;

alter table "public"."categories" validate constraint "categories_color_check";

alter table "public"."categories" add constraint "categories_tier_check" CHECK ((tier = ANY (ARRAY['fixed'::text, 'needs'::text, 'wants'::text]))) not valid;

alter table "public"."categories" validate constraint "categories_tier_check";

alter table "public"."categories" add constraint "categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."categories" validate constraint "categories_user_id_fkey";

alter table "public"."categories" add constraint "categories_user_id_name_key" UNIQUE using index "categories_user_id_name_key";

alter table "public"."conversations" add constraint "conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_user_id_fkey";

alter table "public"."essentials" add constraint "essentials_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL not valid;

alter table "public"."essentials" validate constraint "essentials_category_id_fkey";

alter table "public"."essentials" add constraint "essentials_currency_check" CHECK ((currency = ANY (ARRAY['IDR'::text, 'USD'::text]))) not valid;

alter table "public"."essentials" validate constraint "essentials_currency_check";

alter table "public"."essentials" add constraint "essentials_estimated_amount_check" CHECK ((estimated_amount >= (0)::numeric)) not valid;

alter table "public"."essentials" validate constraint "essentials_estimated_amount_check";

alter table "public"."essentials" add constraint "essentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."essentials" validate constraint "essentials_user_id_fkey";

alter table "public"."expense_attachments" add constraint "expense_attachments_ai_confidence_check" CHECK (((ai_confidence >= (0)::numeric) AND (ai_confidence <= (1)::numeric))) not valid;

alter table "public"."expense_attachments" validate constraint "expense_attachments_ai_confidence_check";

alter table "public"."expense_attachments" add constraint "expense_attachments_doc_type_check" CHECK ((doc_type = ANY (ARRAY['receipt'::text, 'transfer'::text, 'invoice'::text, 'ewallet'::text, 'unknown'::text]))) not valid;

alter table "public"."expense_attachments" validate constraint "expense_attachments_doc_type_check";

alter table "public"."expense_attachments" add constraint "expense_attachments_expense_id_fkey" FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE not valid;

alter table "public"."expense_attachments" validate constraint "expense_attachments_expense_id_fkey";

alter table "public"."expense_attachments" add constraint "expense_attachments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."expense_attachments" validate constraint "expense_attachments_user_id_fkey";

alter table "public"."expenses" add constraint "expenses_amount_check" CHECK ((amount > (0)::numeric)) not valid;

alter table "public"."expenses" validate constraint "expenses_amount_check";

alter table "public"."expenses" add constraint "expenses_attachment_id_fkey" FOREIGN KEY (attachment_id) REFERENCES public.expense_attachments(id) ON DELETE SET NULL not valid;

alter table "public"."expenses" validate constraint "expenses_attachment_id_fkey";

alter table "public"."expenses" add constraint "expenses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL not valid;

alter table "public"."expenses" validate constraint "expenses_category_id_fkey";

alter table "public"."expenses" add constraint "expenses_currency_check" CHECK ((currency = ANY (ARRAY['IDR'::text, 'USD'::text]))) not valid;

alter table "public"."expenses" validate constraint "expenses_currency_check";

alter table "public"."expenses" add constraint "expenses_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'chat'::text, 'image'::text]))) not valid;

alter table "public"."expenses" validate constraint "expenses_source_check";

alter table "public"."expenses" add constraint "expenses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."expenses" validate constraint "expenses_user_id_fkey";

alter table "public"."messages" add constraint "messages_attachment_id_fkey" FOREIGN KEY (attachment_id) REFERENCES public.expense_attachments(id) ON DELETE SET NULL not valid;

alter table "public"."messages" validate constraint "messages_attachment_id_fkey";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."messages" add constraint "messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text, 'tool'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";

alter table "public"."messages" add constraint "messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_base_currency_check" CHECK ((base_currency = ANY (ARRAY['IDR'::text, 'USD'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_base_currency_check";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_month_start_day_check" CHECK (((month_start_day >= 1) AND (month_start_day <= 28))) not valid;

alter table "public"."profiles" validate constraint "profiles_month_start_day_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."budgets" to "anon";

grant insert on table "public"."budgets" to "anon";

grant references on table "public"."budgets" to "anon";

grant select on table "public"."budgets" to "anon";

grant trigger on table "public"."budgets" to "anon";

grant truncate on table "public"."budgets" to "anon";

grant update on table "public"."budgets" to "anon";

grant delete on table "public"."budgets" to "authenticated";

grant insert on table "public"."budgets" to "authenticated";

grant references on table "public"."budgets" to "authenticated";

grant select on table "public"."budgets" to "authenticated";

grant trigger on table "public"."budgets" to "authenticated";

grant truncate on table "public"."budgets" to "authenticated";

grant update on table "public"."budgets" to "authenticated";

grant delete on table "public"."budgets" to "service_role";

grant insert on table "public"."budgets" to "service_role";

grant references on table "public"."budgets" to "service_role";

grant select on table "public"."budgets" to "service_role";

grant trigger on table "public"."budgets" to "service_role";

grant truncate on table "public"."budgets" to "service_role";

grant update on table "public"."budgets" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."essentials" to "anon";

grant insert on table "public"."essentials" to "anon";

grant references on table "public"."essentials" to "anon";

grant select on table "public"."essentials" to "anon";

grant trigger on table "public"."essentials" to "anon";

grant truncate on table "public"."essentials" to "anon";

grant update on table "public"."essentials" to "anon";

grant delete on table "public"."essentials" to "authenticated";

grant insert on table "public"."essentials" to "authenticated";

grant references on table "public"."essentials" to "authenticated";

grant select on table "public"."essentials" to "authenticated";

grant trigger on table "public"."essentials" to "authenticated";

grant truncate on table "public"."essentials" to "authenticated";

grant update on table "public"."essentials" to "authenticated";

grant delete on table "public"."essentials" to "service_role";

grant insert on table "public"."essentials" to "service_role";

grant references on table "public"."essentials" to "service_role";

grant select on table "public"."essentials" to "service_role";

grant trigger on table "public"."essentials" to "service_role";

grant truncate on table "public"."essentials" to "service_role";

grant update on table "public"."essentials" to "service_role";

grant delete on table "public"."expense_attachments" to "anon";

grant insert on table "public"."expense_attachments" to "anon";

grant references on table "public"."expense_attachments" to "anon";

grant select on table "public"."expense_attachments" to "anon";

grant trigger on table "public"."expense_attachments" to "anon";

grant truncate on table "public"."expense_attachments" to "anon";

grant update on table "public"."expense_attachments" to "anon";

grant delete on table "public"."expense_attachments" to "authenticated";

grant insert on table "public"."expense_attachments" to "authenticated";

grant references on table "public"."expense_attachments" to "authenticated";

grant select on table "public"."expense_attachments" to "authenticated";

grant trigger on table "public"."expense_attachments" to "authenticated";

grant truncate on table "public"."expense_attachments" to "authenticated";

grant update on table "public"."expense_attachments" to "authenticated";

grant delete on table "public"."expense_attachments" to "service_role";

grant insert on table "public"."expense_attachments" to "service_role";

grant references on table "public"."expense_attachments" to "service_role";

grant select on table "public"."expense_attachments" to "service_role";

grant trigger on table "public"."expense_attachments" to "service_role";

grant truncate on table "public"."expense_attachments" to "service_role";

grant update on table "public"."expense_attachments" to "service_role";

grant delete on table "public"."expenses" to "anon";

grant insert on table "public"."expenses" to "anon";

grant references on table "public"."expenses" to "anon";

grant select on table "public"."expenses" to "anon";

grant trigger on table "public"."expenses" to "anon";

grant truncate on table "public"."expenses" to "anon";

grant update on table "public"."expenses" to "anon";

grant delete on table "public"."expenses" to "authenticated";

grant insert on table "public"."expenses" to "authenticated";

grant references on table "public"."expenses" to "authenticated";

grant select on table "public"."expenses" to "authenticated";

grant trigger on table "public"."expenses" to "authenticated";

grant truncate on table "public"."expenses" to "authenticated";

grant update on table "public"."expenses" to "authenticated";

grant delete on table "public"."expenses" to "service_role";

grant insert on table "public"."expenses" to "service_role";

grant references on table "public"."expenses" to "service_role";

grant select on table "public"."expenses" to "service_role";

grant trigger on table "public"."expenses" to "service_role";

grant truncate on table "public"."expenses" to "service_role";

grant update on table "public"."expenses" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "budgets: delete own"
  on "public"."budgets"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "budgets: insert own"
  on "public"."budgets"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "budgets: select own"
  on "public"."budgets"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "budgets: update own"
  on "public"."budgets"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "categories: delete own"
  on "public"."categories"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "categories: insert own"
  on "public"."categories"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "categories: select own"
  on "public"."categories"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "categories: update own"
  on "public"."categories"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "conversations: delete own"
  on "public"."conversations"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "conversations: insert own"
  on "public"."conversations"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "conversations: select own"
  on "public"."conversations"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "conversations: update own"
  on "public"."conversations"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "essentials: delete own"
  on "public"."essentials"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "essentials: insert own"
  on "public"."essentials"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "essentials: select own"
  on "public"."essentials"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "essentials: update own"
  on "public"."essentials"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "expense_attachments: delete own"
  on "public"."expense_attachments"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "expense_attachments: insert own"
  on "public"."expense_attachments"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "expense_attachments: select own"
  on "public"."expense_attachments"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "expense_attachments: update own"
  on "public"."expense_attachments"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "expenses: delete own"
  on "public"."expenses"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "expenses: insert own"
  on "public"."expenses"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "expenses: select own"
  on "public"."expenses"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "expenses: update own"
  on "public"."expenses"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "messages: delete own"
  on "public"."messages"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "messages: insert own"
  on "public"."messages"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "messages: select own"
  on "public"."messages"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "messages: update own"
  on "public"."messages"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "profiles: insert own"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((id = ( SELECT auth.uid() AS uid)));



  create policy "profiles: select own"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((id = ( SELECT auth.uid() AS uid)));



  create policy "profiles: update own"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((id = ( SELECT auth.uid() AS uid)))
with check ((id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.essentials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expense_attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "expense-attachments: delete own"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'expense-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "expense-attachments: insert own"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'expense-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "expense-attachments: select own"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'expense-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "expense-attachments: update own"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'expense-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



