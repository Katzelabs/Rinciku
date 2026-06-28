import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Verify the caller is a signed-in Rinciku user. The anon client is scoped
  //    to the caller's JWT so getUser() resolves to the account being deleted.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  // 2. Delete the auth user with the service role. Every user-owned table FKs
  //    auth.users(id) ON DELETE CASCADE, so this removes all of their data too.
  const adminClient = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 2a. Remove the user's attachment objects first. The DB cascade clears the
  //     expense_attachments / income_attachments rows, but NOT the underlying
  //     storage objects — those would be orphaned. storage_path holds the full
  //     {uid}/{year-month}/{uuid}.ext path. Best-effort: a storage failure must
  //     not block account deletion, so we log and continue.
  const attachmentSources: Array<{ table: string; bucket: string }> = [
    { table: 'expense_attachments', bucket: 'expense-attachments' },
    { table: 'income_attachments', bucket: 'income-attachments' },
  ];
  for (const { table, bucket } of attachmentSources) {
    const { data: rows, error: listErr } = await adminClient
      .from(table)
      .select('storage_path')
      .eq('user_id', user.id);
    if (listErr) {
      console.error(`Failed to list ${table} for storage cleanup`, listErr);
      continue;
    }
    const paths = ((rows ?? []) as Array<{ storage_path: string | null }>)
      .map((row) => row.storage_path)
      .filter((path): path is string => Boolean(path));
    if (paths.length === 0) continue;
    const { error: removeErr } = await adminClient.storage
      .from(bucket)
      .remove(paths);
    if (removeErr) {
      console.error(`Failed to remove objects from ${bucket}`, removeErr);
    }
  }

  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteErr) {
    console.error('Failed to delete user', deleteErr);
    return new Response(
      JSON.stringify({ error: 'Could not delete account.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
