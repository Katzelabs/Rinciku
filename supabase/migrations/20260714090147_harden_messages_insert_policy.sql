drop policy "messages: insert own" on "public"."messages";


  create policy "messages: insert own"
  on "public"."messages"
  as permissive
  for insert
  to authenticated
with check (((user_id = ( SELECT auth.uid() AS uid)) AND (conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE (conversations.user_id = ( SELECT auth.uid() AS uid))))));



