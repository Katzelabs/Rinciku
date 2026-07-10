drop index if exists "public"."conversations_user_last_message_idx";

alter table "public"."conversations" add column "summary" text;

alter table "public"."conversations" add column "summary_message_count" integer not null default 0;

CREATE INDEX conversations_user_last_message_idx ON public.conversations USING btree (user_id, last_message_at DESC NULLS LAST, created_at DESC);


