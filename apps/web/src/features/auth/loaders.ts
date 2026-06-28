import { redirect, type LoaderFunctionArgs } from 'react-router';
import { supabase } from '@/lib/supabase';

function signInRedirect(request: Request) {
  const url = new URL(request.url);
  const redirectTo = url.pathname + url.search;
  const params = new URLSearchParams({ redirectTo });
  return redirect(`/sign-in?${params.toString()}`);
}

// Block open-redirects: only same-origin paths, no protocol-relative URLs.
function safeInternalPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  return value;
}

export async function requireAuthLoader({ request }: LoaderFunctionArgs) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw signInRedirect(request);
  return { session: data.session };
}

export async function requireOnboardedLoader({ request }: LoaderFunctionArgs) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw signInRedirect(request);

  const userId = sessionData.session.user.id;
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load profile in loader', error);
  }

  if (!profile?.onboarded_at) {
    throw redirect('/onboarding');
  }

  return { session: sessionData.session, profile };
}

export async function requireGuestLoader({ request }: LoaderFunctionArgs) {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    const url = new URL(request.url);
    const target = safeInternalPath(url.searchParams.get('redirectTo')) ?? '/';
    throw redirect(target);
  }
  return null;
}
