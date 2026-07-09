// CORS allowlist shared by all edge functions. Browsers only — native apps
// send no Origin header and are unaffected. The allowlist comes from the
// ALLOWED_ORIGINS secret (comma-separated); the default covers local dev.
// Prod: `supabase secrets set ALLOWED_ORIGINS=https://app.rinciku.com`.

const ALLOWED_ORIGINS = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Echo the request Origin only when allowlisted; otherwise answer with the
// first allowed origin so disallowed browser contexts fail the CORS check.
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    Vary: 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };
}
