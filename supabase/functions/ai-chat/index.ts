import OpenAI from 'npm:openai';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthedUser } from '../_shared/auth.ts';
import { json } from '../_shared/http.ts';
import {
  toOpenAIMessages,
  toOpenAITools,
  toOpenAIToolChoice,
  toContentBlocks,
} from './translate.ts';
import {
  OPENROUTER_BASE_URL,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_MAX_TOKENS,
  MAX_TOKENS_CAP,
  enforceRateLimits,
  validateChatBody,
} from './guards.ts';

// Authenticated proxy for the chat LLM, routed through OpenRouter (OpenAI-
// compatible API). Translation to/from the client's provider-agnostic shape
// lives in translate.ts; abuse limits and tunables in guards.ts. The key
// never reaches the browser.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return json(req, { error: 'Method not allowed' }, 405);
  }

  // 1. Verify the caller is a signed-in Rinciku user.
  const authed = await getAuthedUser(req);
  if (!authed) {
    return json(req, { error: 'Unauthorized' }, 401);
  }

  // 2. Throttle per user.
  const limited = await enforceRateLimits(authed.userClient);
  if (limited) {
    return json(req, { error: limited.error }, limited.status);
  }

  // 3. Parse + relay to OpenRouter. The secret comes from env, never the client.
  const validated = validateChatBody(await req.text());
  if (!validated.ok) {
    return json(req, { error: validated.error }, validated.status);
  }
  const body = validated.body;

  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set');
    return json(req, { error: 'AI is not configured.' }, 500);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: { 'X-Title': 'Rinciku' },
  });

  try {
    // OpenRouter extends the OpenAI schema with a `reasoning` param — ignored
    // by models without reasoning support; see guards.ts for why 'low'.
    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
      reasoning?: { effort: string };
    } = {
      model: Deno.env.get('OPENROUTER_MODEL') ?? DEFAULT_MODEL,
      max_tokens: Math.min(
        Math.max(1, Math.floor(body.max_tokens ?? DEFAULT_MAX_TOKENS)),
        MAX_TOKENS_CAP
      ),
      temperature: Number(
        Deno.env.get('OPENROUTER_TEMPERATURE') ?? DEFAULT_TEMPERATURE
      ),
      messages: toOpenAIMessages(body.system, body.messages),
      tools: toOpenAITools(body.tools),
      tool_choice: toOpenAIToolChoice(body.tool_choice),
      reasoning: {
        effort:
          Deno.env.get('OPENROUTER_REASONING_EFFORT') ??
          DEFAULT_REASONING_EFFORT,
      },
    };
    const completion = await client.chat.completions.create(params);

    const choice = completion.choices[0];
    return json(req, {
      content: choice ? toContentBlocks(choice.message) : [],
      stop_reason: choice?.finish_reason ?? null,
      usage: completion.usage
        ? {
            input_tokens: completion.usage.prompt_tokens,
            output_tokens: completion.usage.completion_tokens,
          }
        : null,
      model: completion.model,
    });
  } catch (err) {
    console.error('OpenRouter request failed', err);
    const status =
      err instanceof OpenAI.APIError && typeof err.status === 'number'
        ? err.status
        : 502;
    return json(
      req,
      { error: 'The assistant could not respond. Please try again.' },
      status
    );
  }
});
