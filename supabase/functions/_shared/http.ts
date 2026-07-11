import { corsHeaders } from './cors.ts';

// JSON response helper shared by edge functions — always carries the CORS
// headers for the requesting origin.
export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}
