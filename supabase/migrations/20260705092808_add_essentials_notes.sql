alter table "public"."essentials" add column "notes" text;

alter table "public"."essentials" add constraint "essentials_notes_check" CHECK (((notes IS NULL) OR (char_length(notes) <= 280))) not valid;

alter table "public"."essentials" validate constraint "essentials_notes_check";


