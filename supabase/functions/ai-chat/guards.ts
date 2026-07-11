import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import type { ChatRequest } from './translate.ts';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
// Model is env-configurable (any OpenRouter slug, Claude or otherwise). Set
// OPENROUTER_MODEL in supabase/functions/.env and `supabase secrets`.
export const DEFAULT_MODEL = 'google/gemini-3.1-flash-lite';
// Sampling knobs, env-tunable. Gemini defaults to temperature 1.0, which
// hurts tool-argument precision; 0.4 keeps answers warm but tool calls tight.
// Reasoning effort 'low' (over Gemini's default 'minimal') measurably helps
// multi-step tool planning at negligible cost; models without reasoning
// support ignore the param.
export const DEFAULT_TEMPERATURE = 0.4;
export const DEFAULT_REASONING_EFFORT = 'low';
// Headroom for the agentic loop: a turn may interleave reasoning, tool calls,
// and a final summary. Still env-overridable per request via max_tokens.
export const DEFAULT_MAX_TOKENS = 4096;
// Abuse guards. The clients never send max_tokens today; the cap exists so a
// crafted request can't turn this proxy into a cost sink. Size limits bound
// what we forward to the LLM: the client caps attachments at 10 MB, which is
// ~13.4 MB base64 — 15 MB leaves headroom without allowing arbitrary bodies.
export const MAX_TOKENS_CAP = 8192;
export const MAX_MESSAGES = 60;
export const MAX_BODY_BYTES = 15_000_000;
export const MAX_IMAGE_BLOCKS = 5;
// Per-user fixed windows via public.check_rate_limit (see 20_rate_limits.sql).
// One agentic turn is up to 8 invocations (client MAX_STEPS), so 20/min ≈ 2.5
// worst-case turns a minute (typical turns use far fewer steps); the daily
// cap kills sustained proxy abuse.
export const RATE_LIMITS = [
  { bucket: 'ai-chat-min', maxHits: 20, windowSeconds: 60 },
  { bucket: 'ai-chat-day', maxHits: 200, windowSeconds: 86_400 },
];

// Throttle. The RPC derives the user from the JWT (auth.uid()), so the
// caller can't spoof another user's budget. Fail closed on RPC errors.
export async function enforceRateLimits(
  userClient: SupabaseClient
): Promise<{ error: string; status: number } | null> {
  for (const limit of RATE_LIMITS) {
    const { data: allowed, error: rlErr } = await userClient.rpc(
      'check_rate_limit',
      {
        p_bucket: limit.bucket,
        p_max_hits: limit.maxHits,
        p_window_seconds: limit.windowSeconds,
      }
    );
    if (rlErr) {
      console.error('rate limit check failed', rlErr);
      return { error: 'Please try again shortly.', status: 500 };
    }
    if (!allowed) {
      return { error: 'Too many requests. Please slow down.', status: 429 };
    }
  }
  return null;
}

export function validateChatBody(
  rawBody: string
):
  | { ok: true; body: ChatRequest }
  | { ok: false; error: string; status: number } {
  if (rawBody.length > MAX_BODY_BYTES) {
    return { ok: false, error: 'Request body too large', status: 413 };
  }
  let body: ChatRequest;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { ok: false, error: 'Invalid JSON body', status: 400 };
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return {
      ok: false,
      error: 'messages must be a non-empty array',
      status: 400,
    };
  }
  if (body.messages.length > MAX_MESSAGES) {
    return {
      ok: false,
      error: `messages exceeds ${MAX_MESSAGES}`,
      status: 400,
    };
  }
  const imageBlocks = body.messages
    .flatMap((m) => (Array.isArray(m.content) ? m.content : []))
    .filter((block) => block.type === 'image').length;
  if (imageBlocks > MAX_IMAGE_BLOCKS) {
    return {
      ok: false,
      error: `too many images (max ${MAX_IMAGE_BLOCKS})`,
      status: 400,
    };
  }
  return { ok: true, body };
}
