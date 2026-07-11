import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { SupabaseClient, User } from 'jsr:@supabase/supabase-js@2';

// Verifies the caller is a signed-in Rinciku user. Returns an anon client
// scoped to the caller's JWT (so RLS and auth.uid()-based RPCs resolve to
// them) plus the resolved user, or null when the request is unauthenticated.
// Callers shape their own 401 response.
export async function getAuthedUser(
  req: Request
): Promise<{ userClient: SupabaseClient; user: User } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) return null;

  return { userClient, user };
}
