
  create table "public"."budgets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "category_id" uuid not null,
    "period_year" smallint not null,
    "period_month" smallint not null,
    "amount" numeric(15,2) not null,
    "currency" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."budgets" enable row level security;


  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "tier_id" uuid,
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
    "occurred_at" timestamp with time zone not null default now(),
    "note" text,
    "source" text not null default 'manual'::text,
    "attachment_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."expenses" enable row level security;


  create table "public"."income_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "income_id" uuid,
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


alter table "public"."income_attachments" enable row level security;


  create table "public"."income_categories" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "icon" text,
    "color" text,
    "sort_order" integer not null default 0,
    "is_archived" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."income_categories" enable row level security;


  create table "public"."incomes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "source_id" uuid,
    "amount" numeric(15,2) not null,
    "currency" text not null,
    "occurred_at" timestamp with time zone not null default now(),
    "note" text,
    "source" text not null default 'manual'::text,
    "attachment_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."incomes" enable row level security;


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
    "expected_monthly_income" numeric(15,2) not null default 0,
    "expected_monthly_income_currency" text not null default 'IDR'::text,
    "month_start_day" smallint not null default 1,
    "onboarded_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."tier_budgets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "tier_id" uuid not null,
    "period_year" smallint not null,
    "period_month" smallint not null,
    "amount" numeric(15,2) not null,
    "currency" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."tier_budgets" enable row level security;


  create table "public"."tiers" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "color" text,
    "is_essential" boolean not null default false,
    "sort_order" integer not null default 0,
    "is_archived" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."tiers" enable row level security;

CREATE UNIQUE INDEX budgets_pkey ON public.budgets USING btree (id);

CREATE UNIQUE INDEX budgets_user_id_category_id_period_year_period_month_key ON public.budgets USING btree (user_id, category_id, period_year, period_month);

CREATE INDEX budgets_user_id_idx ON public.budgets USING btree (user_id);

CREATE INDEX budgets_user_period_idx ON public.budgets USING btree (user_id, period_year, period_month);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE INDEX categories_user_id_idx ON public.categories USING btree (user_id);

CREATE UNIQUE INDEX categories_user_id_name_key ON public.categories USING btree (user_id, name);

CREATE INDEX categories_user_tier_sort_idx ON public.categories USING btree (user_id, tier_id, sort_order);

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

CREATE INDEX income_attachments_income_id_idx ON public.income_attachments USING btree (income_id);

CREATE UNIQUE INDEX income_attachments_pkey ON public.income_attachments USING btree (id);

CREATE INDEX income_attachments_user_confirmed_idx ON public.income_attachments USING btree (user_id, confirmed);

CREATE INDEX income_attachments_user_id_idx ON public.income_attachments USING btree (user_id);

CREATE UNIQUE INDEX income_categories_pkey ON public.income_categories USING btree (id);

CREATE INDEX income_categories_user_id_idx ON public.income_categories USING btree (user_id);

CREATE UNIQUE INDEX income_categories_user_id_name_key ON public.income_categories USING btree (user_id, name);

CREATE INDEX income_categories_user_sort_idx ON public.income_categories USING btree (user_id, sort_order);

CREATE UNIQUE INDEX incomes_pkey ON public.incomes USING btree (id);

CREATE INDEX incomes_user_id_idx ON public.incomes USING btree (user_id);

CREATE INDEX incomes_user_occurred_at_idx ON public.incomes USING btree (user_id, occurred_at DESC);

CREATE INDEX incomes_user_source_id_idx ON public.incomes USING btree (user_id, source_id);

CREATE INDEX incomes_user_source_idx ON public.incomes USING btree (user_id, source);

CREATE INDEX messages_conversation_created_idx ON public.messages USING btree (conversation_id, created_at);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE INDEX messages_user_id_idx ON public.messages USING btree (user_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX tier_budgets_pkey ON public.tier_budgets USING btree (id);

CREATE INDEX tier_budgets_user_id_idx ON public.tier_budgets USING btree (user_id);

CREATE UNIQUE INDEX tier_budgets_user_id_tier_id_period_year_period_month_key ON public.tier_budgets USING btree (user_id, tier_id, period_year, period_month);

CREATE INDEX tier_budgets_user_period_idx ON public.tier_budgets USING btree (user_id, period_year, period_month);

CREATE UNIQUE INDEX tiers_pkey ON public.tiers USING btree (id);

CREATE INDEX tiers_user_id_idx ON public.tiers USING btree (user_id);

CREATE UNIQUE INDEX tiers_user_id_name_key ON public.tiers USING btree (user_id, name);

CREATE INDEX tiers_user_sort_idx ON public.tiers USING btree (user_id, sort_order);

alter table "public"."budgets" add constraint "budgets_pkey" PRIMARY KEY using index "budgets_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."essentials" add constraint "essentials_pkey" PRIMARY KEY using index "essentials_pkey";

alter table "public"."expense_attachments" add constraint "expense_attachments_pkey" PRIMARY KEY using index "expense_attachments_pkey";

alter table "public"."expenses" add constraint "expenses_pkey" PRIMARY KEY using index "expenses_pkey";

alter table "public"."income_attachments" add constraint "income_attachments_pkey" PRIMARY KEY using index "income_attachments_pkey";

alter table "public"."income_categories" add constraint "income_categories_pkey" PRIMARY KEY using index "income_categories_pkey";

alter table "public"."incomes" add constraint "incomes_pkey" PRIMARY KEY using index "incomes_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."tier_budgets" add constraint "tier_budgets_pkey" PRIMARY KEY using index "tier_budgets_pkey";

alter table "public"."tiers" add constraint "tiers_pkey" PRIMARY KEY using index "tiers_pkey";

alter table "public"."budgets" add constraint "budgets_amount_check" CHECK ((amount >= (0)::numeric)) not valid;

alter table "public"."budgets" validate constraint "budgets_amount_check";

alter table "public"."budgets" add constraint "budgets_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE not valid;

alter table "public"."budgets" validate constraint "budgets_category_id_fkey";

alter table "public"."budgets" add constraint "budgets_currency_check" CHECK ((currency = ANY (ARRAY['IDR'::text, 'USD'::text, 'EUR'::text, 'JPY'::text, 'GBP'::text, 'SGD'::text, 'MYR'::text, 'AUD'::text, 'CAD'::text, 'CNY'::text, 'KRW'::text, 'HKD'::text, 'THB'::text, 'PHP'::text, 'INR'::text, 'VND'::text]))) not valid;

alter table "public"."budgets" validate constraint "budgets_currency_check";

alter table "public"."budgets" add constraint "budgets_period_month_check" CHECK (((period_month >= 1) AND (period_month <= 12))) not valid;

alter table "public"."budgets" validate constraint "budgets_period_month_check";

alter table "public"."budgets" add constraint "budgets_period_year_check" CHECK (((period_year >= 2020) AND (period_year <= 2100))) not valid;

alter table "public"."budgets" validate constraint "budgets_period_year_check";

alter table "public"."budgets" add constraint "budgets_user_id_category_id_period_year_period_month_key" UNIQUE using index "budgets_user_id_category_id_period_year_period_month_key";

alter table "public"."budgets" add constraint "budgets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."budgets" validate constraint "budgets_user_id_fkey";

alter table "public"."categories" add constraint "categories_color_check" CHECK ((color ~ '^#[0-9a-fA-F]{6}$'::text)) not valid;

alter table "public"."categories" validate constraint "categories_color_check";

alter table "public"."categories" add constraint "categories_tier_id_fkey" FOREIGN KEY (tier_id) REFERENCES public.tiers(id) ON DELETE SET NULL not valid;

alter table "public"."categories" validate constraint "categories_tier_id_fkey";

alter table "public"."categories" add constraint "categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."categories" validate constraint "categories_user_id_fkey";

alter table "public"."categories" add constraint "categories_user_id_name_key" UNIQUE using index "categories_user_id_name_key";

alter table "public"."conversations" add constraint "conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_user_id_fkey";

alter table "public"."essentials" add constraint "essentials_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL not valid;

alter table "public"."essentials" validate constraint "essentials_category_id_fkey";

alter table "public"."essentials" add constraint "essentials_currency_check" CHECK ((currency = ANY (ARRAY['IDR'::text, 'USD'::text, 'EUR'::text, 'JPY'::text, 'GBP'::text, 'SGD'::text, 'MYR'::text, 'AUD'::text, 'CAD'::text, 'CNY'::text, 'KRW'::text, 'HKD'::text, 'THB'::text, 'PHP'::text, 'INR'::text, 'VND'::text]))) not valid;

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

alter table "public"."expenses" add constraint "expenses_currency_check" CHECK ((currency = ANY (ARRAY['IDR'::text, 'USD'::text, 'EUR'::text, 'JPY'::text, 'GBP'::text, 'SGD'::text, 'MYR'::text, 'AUD'::text, 'CAD'::text, 'CNY'::text, 'KRW'::text, 'HKD'::text, 'THB'::text, 'PHP'::text, 'INR'::text, 'VND'::text]))) not valid;

alter table "public"."expenses" validate constraint "expenses_currency_check";

alter table "public"."expenses" add constraint "expenses_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'chat'::text, 'image'::text]))) not valid;

alter table "public"."expenses" validate constraint "expenses_source_check";

alter table "public"."expenses" add constraint "expenses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."expenses" validate constraint "expenses_user_id_fkey";

alter table "public"."income_attachments" add constraint "income_attachments_ai_confidence_check" CHECK (((ai_confidence >= (0)::numeric) AND (ai_confidence <= (1)::numeric))) not valid;

alter table "public"."income_attachments" validate constraint "income_attachments_ai_confidence_check";

alter table "public"."income_attachments" add constraint "income_attachments_doc_type_check" CHECK ((doc_type = ANY (ARRAY['receipt'::text, 'transfer'::text, 'invoice'::text, 'ewallet'::text, 'unknown'::text]))) not valid;

alter table "public"."income_attachments" validate constraint "income_attachments_doc_type_check";

alter table "public"."income_attachments" add constraint "income_attachments_income_id_fkey" FOREIGN KEY (income_id) REFERENCES public.incomes(id) ON DELETE CASCADE not valid;

alter table "public"."income_attachments" validate constraint "income_attachments_income_id_fkey";

alter table "public"."income_attachments" add constraint "income_attachments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."income_attachments" validate constraint "income_attachments_user_id_fkey";

alter table "public"."income_categories" add constraint "income_categories_color_check" CHECK ((color ~ '^#[0-9a-fA-F]{6}$'::text)) not valid;

alter table "public"."income_categories" validate constraint "income_categories_color_check";

alter table "public"."income_categories" add constraint "income_categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."income_categories" validate constraint "income_categories_user_id_fkey";

alter table "public"."income_categories" add constraint "income_categories_user_id_name_key" UNIQUE using index "income_categories_user_id_name_key";

alter table "public"."incomes" add constraint "incomes_amount_check" CHECK ((amount > (0)::numeric)) not valid;

alter table "public"."incomes" validate constraint "incomes_amount_check";

alter table "public"."incomes" add constraint "incomes_attachment_id_fkey" FOREIGN KEY (attachment_id) REFERENCES public.income_attachments(id) ON DELETE SET NULL not valid;

alter table "public"."incomes" validate constraint "incomes_attachment_id_fkey";

alter table "public"."incomes" add constraint "incomes_currency_check" CHECK ((currency = ANY (ARRAY['IDR'::text, 'USD'::text, 'EUR'::text, 'JPY'::text, 'GBP'::text, 'SGD'::text, 'MYR'::text, 'AUD'::text, 'CAD'::text, 'CNY'::text, 'KRW'::text, 'HKD'::text, 'THB'::text, 'PHP'::text, 'INR'::text, 'VND'::text]))) not valid;

alter table "public"."incomes" validate constraint "incomes_currency_check";

alter table "public"."incomes" add constraint "incomes_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'chat'::text, 'image'::text]))) not valid;

alter table "public"."incomes" validate constraint "incomes_source_check";

alter table "public"."incomes" add constraint "incomes_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.income_categories(id) ON DELETE SET NULL not valid;

alter table "public"."incomes" validate constraint "incomes_source_id_fkey";

alter table "public"."incomes" add constraint "incomes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."incomes" validate constraint "incomes_user_id_fkey";

alter table "public"."messages" add constraint "messages_attachment_id_fkey" FOREIGN KEY (attachment_id) REFERENCES public.expense_attachments(id) ON DELETE SET NULL not valid;

alter table "public"."messages" validate constraint "messages_attachment_id_fkey";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."messages" add constraint "messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text, 'tool'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_role_check";

alter table "public"."messages" add constraint "messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_base_currency_check" CHECK ((base_currency = ANY (ARRAY['IDR'::text, 'USD'::text, 'EUR'::text, 'JPY'::text, 'GBP'::text, 'SGD'::text, 'MYR'::text, 'AUD'::text, 'CAD'::text, 'CNY'::text, 'KRW'::text, 'HKD'::text, 'THB'::text, 'PHP'::text, 'INR'::text, 'VND'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_base_currency_check";

alter table "public"."profiles" add constraint "profiles_expected_monthly_income_check" CHECK ((expected_monthly_income >= (0)::numeric)) not valid;

alter table "public"."profiles" validate constraint "profiles_expected_monthly_income_check";

alter table "public"."profiles" add constraint "profiles_expected_monthly_income_currency_check" CHECK ((expected_monthly_income_currency = ANY (ARRAY['IDR'::text, 'USD'::text, 'EUR'::text, 'JPY'::text, 'GBP'::text, 'SGD'::text, 'MYR'::text, 'AUD'::text, 'CAD'::text, 'CNY'::text, 'KRW'::text, 'HKD'::text, 'THB'::text, 'PHP'::text, 'INR'::text, 'VND'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_expected_monthly_income_currency_check";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_month_start_day_check" CHECK (((month_start_day >= 1) AND (month_start_day <= 28))) not valid;

alter table "public"."profiles" validate constraint "profiles_month_start_day_check";

alter table "public"."tier_budgets" add constraint "tier_budgets_amount_check" CHECK ((amount >= (0)::numeric)) not valid;

alter table "public"."tier_budgets" validate constraint "tier_budgets_amount_check";

alter table "public"."tier_budgets" add constraint "tier_budgets_currency_check" CHECK ((currency = ANY (ARRAY['IDR'::text, 'USD'::text, 'EUR'::text, 'JPY'::text, 'GBP'::text, 'SGD'::text, 'MYR'::text, 'AUD'::text, 'CAD'::text, 'CNY'::text, 'KRW'::text, 'HKD'::text, 'THB'::text, 'PHP'::text, 'INR'::text, 'VND'::text]))) not valid;

alter table "public"."tier_budgets" validate constraint "tier_budgets_currency_check";

alter table "public"."tier_budgets" add constraint "tier_budgets_period_month_check" CHECK (((period_month >= 1) AND (period_month <= 12))) not valid;

alter table "public"."tier_budgets" validate constraint "tier_budgets_period_month_check";

alter table "public"."tier_budgets" add constraint "tier_budgets_period_year_check" CHECK (((period_year >= 2020) AND (period_year <= 2100))) not valid;

alter table "public"."tier_budgets" validate constraint "tier_budgets_period_year_check";

alter table "public"."tier_budgets" add constraint "tier_budgets_tier_id_fkey" FOREIGN KEY (tier_id) REFERENCES public.tiers(id) ON DELETE CASCADE not valid;

alter table "public"."tier_budgets" validate constraint "tier_budgets_tier_id_fkey";

alter table "public"."tier_budgets" add constraint "tier_budgets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tier_budgets" validate constraint "tier_budgets_user_id_fkey";

alter table "public"."tier_budgets" add constraint "tier_budgets_user_id_tier_id_period_year_period_month_key" UNIQUE using index "tier_budgets_user_id_tier_id_period_year_period_month_key";

alter table "public"."tiers" add constraint "tiers_color_check" CHECK ((color ~ '^#[0-9a-fA-F]{6}$'::text)) not valid;

alter table "public"."tiers" validate constraint "tiers_color_check";

alter table "public"."tiers" add constraint "tiers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tiers" validate constraint "tiers_user_id_fkey";

alter table "public"."tiers" add constraint "tiers_user_id_name_key" UNIQUE using index "tiers_user_id_name_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.budget_actuals(p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_base text, p_rates jsonb)
 RETURNS TABLE(by_category jsonb, by_tier jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with base_rate as (
    select (p_rates ->> p_base)::numeric as r
  ),
  converted_expenses as (
    select
      e.category_id,
      c.tier_id,
      e.amount * (p_rates ->> e.currency)::numeric / nullif((select r from base_rate), 0) as amount_base
    from public.expenses e
    left join public.categories c on c.id = e.category_id
    where e.user_id = (select auth.uid())
      and e.occurred_at >= p_start_at
      and e.occurred_at <  p_end_at
  ),
  per_category as (
    select category_id, sum(amount_base) as amount_base
    from converted_expenses
    where category_id is not null
    group by category_id
  ),
  per_tier as (
    select tier_id, sum(amount_base) as amount_base
    from converted_expenses
    where tier_id is not null
    group by tier_id
  )
  select
    coalesce((select jsonb_object_agg(category_id::text, amount_base) from per_category), '{}'::jsonb) as by_category,
    coalesce((select jsonb_object_agg(tier_id::text, amount_base) from per_tier), '{}'::jsonb)         as by_tier;
$function$
;

CREATE OR REPLACE FUNCTION public.dashboard_monthly_summary(p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_base text, p_rates jsonb)
 RETURNS TABLE(spent_total numeric, by_tier jsonb, essentials_spent numeric, uncategorized_spent numeric, income_received_this_cycle numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with base_rate as (
    select (p_rates ->> p_base)::numeric as r
  ),
  converted_expenses as (
    select
      c.tier_id,
      t.is_essential,
      e.amount * (p_rates ->> e.currency)::numeric / nullif((select r from base_rate), 0) as amount_base
    from public.expenses e
    left join public.categories c on c.id = e.category_id
    left join public.tiers t      on t.id = c.tier_id
    where e.user_id = (select auth.uid())
      and e.occurred_at >= p_start_at
      and e.occurred_at <  p_end_at
  ),
  converted_incomes as (
    select
      i.amount * (p_rates ->> i.currency)::numeric / nullif((select r from base_rate), 0) as amount_base
    from public.incomes i
    where i.user_id = (select auth.uid())
      and i.occurred_at >= p_start_at
      and i.occurred_at <  p_end_at
  ),
  per_tier as (
    select tier_id, sum(amount_base) as amount_base
    from converted_expenses
    where tier_id is not null
    group by tier_id
  ),
  expense_aggs as (
    select
      coalesce((select sum(amount_base) from converted_expenses), 0)                                  as spent_total,
      coalesce((select sum(amount_base) from converted_expenses where is_essential), 0)               as essentials_spent,
      coalesce((select sum(amount_base) from converted_expenses where tier_id is null), 0)            as uncategorized_spent,
      coalesce((select jsonb_object_agg(tier_id::text, amount_base) from per_tier), '{}'::jsonb)      as by_tier
  ),
  income_aggs as (
    select coalesce(sum(amount_base), 0) as income_received_this_cycle
    from converted_incomes
  )
  select
    e.spent_total,
    e.by_tier,
    e.essentials_spent,
    e.uncategorized_spent,
    i.income_received_this_cycle
  from expense_aggs e, income_aggs i;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_category_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.tier_id is not null
     and (select count(*) from public.categories
          where user_id = new.user_id
            and tier_id = new.tier_id
            and is_archived = false
            and id <> new.id) >= 15 then
    raise exception 'Category limit reached. Each tier can have at most 15 categories.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_income_category_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if (select count(*) from public.income_categories
      where user_id = new.user_id and is_archived = false) >= 20 then
    raise exception 'Income category limit reached. You can have at most 20 income categories.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_tier_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if (select count(*) from public.tiers
      where user_id = new.user_id and is_archived = false) >= 6 then
    raise exception 'Tier limit reached. You can have at most 6 tiers.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_fixed uuid;
  v_needs uuid;
  v_wants uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  -- Default tiers. Fixed + Needs count toward the essentials baseline math;
  -- Wants does not. Users can rename/recolor/add/delete tiers afterwards.
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

  -- Default income categories (flat — no tier). Users can rename/recolor/add/delete.
  -- Icon names are PascalCase lucide keys (see src/features/categories/lib/icons.ts).
  insert into public.income_categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Salary',     'Banknote',   '#7a8d6a', 0),
    (new.id, 'Freelance',  'Briefcase',  '#a3a86b', 1),
    (new.id, 'Investment', 'TrendingUp', '#6b8da3', 2),
    (new.id, 'Other',      'Wallet',     '#8d8d8d', 3);

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

grant delete on table "public"."income_attachments" to "anon";

grant insert on table "public"."income_attachments" to "anon";

grant references on table "public"."income_attachments" to "anon";

grant select on table "public"."income_attachments" to "anon";

grant trigger on table "public"."income_attachments" to "anon";

grant truncate on table "public"."income_attachments" to "anon";

grant update on table "public"."income_attachments" to "anon";

grant delete on table "public"."income_attachments" to "authenticated";

grant insert on table "public"."income_attachments" to "authenticated";

grant references on table "public"."income_attachments" to "authenticated";

grant select on table "public"."income_attachments" to "authenticated";

grant trigger on table "public"."income_attachments" to "authenticated";

grant truncate on table "public"."income_attachments" to "authenticated";

grant update on table "public"."income_attachments" to "authenticated";

grant delete on table "public"."income_attachments" to "service_role";

grant insert on table "public"."income_attachments" to "service_role";

grant references on table "public"."income_attachments" to "service_role";

grant select on table "public"."income_attachments" to "service_role";

grant trigger on table "public"."income_attachments" to "service_role";

grant truncate on table "public"."income_attachments" to "service_role";

grant update on table "public"."income_attachments" to "service_role";

grant delete on table "public"."income_categories" to "anon";

grant insert on table "public"."income_categories" to "anon";

grant references on table "public"."income_categories" to "anon";

grant select on table "public"."income_categories" to "anon";

grant trigger on table "public"."income_categories" to "anon";

grant truncate on table "public"."income_categories" to "anon";

grant update on table "public"."income_categories" to "anon";

grant delete on table "public"."income_categories" to "authenticated";

grant insert on table "public"."income_categories" to "authenticated";

grant references on table "public"."income_categories" to "authenticated";

grant select on table "public"."income_categories" to "authenticated";

grant trigger on table "public"."income_categories" to "authenticated";

grant truncate on table "public"."income_categories" to "authenticated";

grant update on table "public"."income_categories" to "authenticated";

grant delete on table "public"."income_categories" to "service_role";

grant insert on table "public"."income_categories" to "service_role";

grant references on table "public"."income_categories" to "service_role";

grant select on table "public"."income_categories" to "service_role";

grant trigger on table "public"."income_categories" to "service_role";

grant truncate on table "public"."income_categories" to "service_role";

grant update on table "public"."income_categories" to "service_role";

grant delete on table "public"."incomes" to "anon";

grant insert on table "public"."incomes" to "anon";

grant references on table "public"."incomes" to "anon";

grant select on table "public"."incomes" to "anon";

grant trigger on table "public"."incomes" to "anon";

grant truncate on table "public"."incomes" to "anon";

grant update on table "public"."incomes" to "anon";

grant delete on table "public"."incomes" to "authenticated";

grant insert on table "public"."incomes" to "authenticated";

grant references on table "public"."incomes" to "authenticated";

grant select on table "public"."incomes" to "authenticated";

grant trigger on table "public"."incomes" to "authenticated";

grant truncate on table "public"."incomes" to "authenticated";

grant update on table "public"."incomes" to "authenticated";

grant delete on table "public"."incomes" to "service_role";

grant insert on table "public"."incomes" to "service_role";

grant references on table "public"."incomes" to "service_role";

grant select on table "public"."incomes" to "service_role";

grant trigger on table "public"."incomes" to "service_role";

grant truncate on table "public"."incomes" to "service_role";

grant update on table "public"."incomes" to "service_role";

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

grant delete on table "public"."tier_budgets" to "anon";

grant insert on table "public"."tier_budgets" to "anon";

grant references on table "public"."tier_budgets" to "anon";

grant select on table "public"."tier_budgets" to "anon";

grant trigger on table "public"."tier_budgets" to "anon";

grant truncate on table "public"."tier_budgets" to "anon";

grant update on table "public"."tier_budgets" to "anon";

grant delete on table "public"."tier_budgets" to "authenticated";

grant insert on table "public"."tier_budgets" to "authenticated";

grant references on table "public"."tier_budgets" to "authenticated";

grant select on table "public"."tier_budgets" to "authenticated";

grant trigger on table "public"."tier_budgets" to "authenticated";

grant truncate on table "public"."tier_budgets" to "authenticated";

grant update on table "public"."tier_budgets" to "authenticated";

grant delete on table "public"."tier_budgets" to "service_role";

grant insert on table "public"."tier_budgets" to "service_role";

grant references on table "public"."tier_budgets" to "service_role";

grant select on table "public"."tier_budgets" to "service_role";

grant trigger on table "public"."tier_budgets" to "service_role";

grant truncate on table "public"."tier_budgets" to "service_role";

grant update on table "public"."tier_budgets" to "service_role";

grant delete on table "public"."tiers" to "anon";

grant insert on table "public"."tiers" to "anon";

grant references on table "public"."tiers" to "anon";

grant select on table "public"."tiers" to "anon";

grant trigger on table "public"."tiers" to "anon";

grant truncate on table "public"."tiers" to "anon";

grant update on table "public"."tiers" to "anon";

grant delete on table "public"."tiers" to "authenticated";

grant insert on table "public"."tiers" to "authenticated";

grant references on table "public"."tiers" to "authenticated";

grant select on table "public"."tiers" to "authenticated";

grant trigger on table "public"."tiers" to "authenticated";

grant truncate on table "public"."tiers" to "authenticated";

grant update on table "public"."tiers" to "authenticated";

grant delete on table "public"."tiers" to "service_role";

grant insert on table "public"."tiers" to "service_role";

grant references on table "public"."tiers" to "service_role";

grant select on table "public"."tiers" to "service_role";

grant trigger on table "public"."tiers" to "service_role";

grant truncate on table "public"."tiers" to "service_role";

grant update on table "public"."tiers" to "service_role";


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



  create policy "income_attachments: delete own"
  on "public"."income_attachments"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "income_attachments: insert own"
  on "public"."income_attachments"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "income_attachments: select own"
  on "public"."income_attachments"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "income_attachments: update own"
  on "public"."income_attachments"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "income_categories: delete own"
  on "public"."income_categories"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "income_categories: insert own"
  on "public"."income_categories"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "income_categories: select own"
  on "public"."income_categories"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "income_categories: update own"
  on "public"."income_categories"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "incomes: delete own"
  on "public"."incomes"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "incomes: insert own"
  on "public"."incomes"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "incomes: select own"
  on "public"."incomes"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "incomes: update own"
  on "public"."incomes"
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



  create policy "tier_budgets: delete own"
  on "public"."tier_budgets"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tier_budgets: insert own"
  on "public"."tier_budgets"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tier_budgets: select own"
  on "public"."tier_budgets"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tier_budgets: update own"
  on "public"."tier_budgets"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tiers: delete own"
  on "public"."tiers"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tiers: insert own"
  on "public"."tiers"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tiers: select own"
  on "public"."tiers"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tiers: update own"
  on "public"."tiers"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER enforce_category_limit BEFORE INSERT ON public.categories FOR EACH ROW EXECUTE FUNCTION public.enforce_category_limit();

CREATE TRIGGER enforce_category_limit_on_move BEFORE UPDATE OF tier_id ON public.categories FOR EACH ROW WHEN ((new.tier_id IS DISTINCT FROM old.tier_id)) EXECUTE FUNCTION public.enforce_category_limit();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.essentials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expense_attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.income_attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER enforce_income_category_limit BEFORE INSERT ON public.income_categories FOR EACH ROW EXECUTE FUNCTION public.enforce_income_category_limit();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.income_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.incomes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tier_budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER enforce_tier_limit BEFORE INSERT ON public.tiers FOR EACH ROW EXECUTE FUNCTION public.enforce_tier_limit();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tiers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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



  create policy "income-attachments: delete own"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'income-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "income-attachments: insert own"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'income-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "income-attachments: select own"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'income-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "income-attachments: update own"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'income-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



