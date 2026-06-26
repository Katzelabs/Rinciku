import { createClient } from 'jsr:@supabase/supabase-js@2';
import OpenAI from 'npm:openai';

// Authenticated proxy for the chat LLM, routed through OpenRouter (OpenAI-
// compatible API). The ai-chat feature builds the grounding system prompt +
// message history client-side (RLS-scoped) in our internal "Anthropic-ish"
// shape; this function translates that to OpenAI Chat Completions, calls
// OpenRouter, and translates the reply back so the client stays provider-
// agnostic. The key never reaches the browser.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
// Model is env-configurable (any OpenRouter slug, Claude or otherwise). Set
// OPENROUTER_MODEL in supabase/functions/.env and `supabase secrets`.
const DEFAULT_MODEL = 'google/gemini-3.1-flash-lite';
// Headroom for the agentic loop: a turn may interleave reasoning, tool calls,
// and a final summary. Still env-overridable per request via max_tokens.
const DEFAULT_MAX_TOKENS = 4096;

// --- Internal (client-facing) request shapes -------------------------------

type TextBlock = { type: 'text'; text: string };
type ImageBlock = {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
};
type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
};
// Result of a client-executed (read) tool, replayed back so the model can
// reason over the data it asked for. content is an opaque JSON/text string.
type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
};
type InContent =
  | string
  | Array<TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock>;
type InMessage = { role: 'user' | 'assistant'; content: InContent };
type InTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};
type InToolChoice =
  | { type: 'auto' }
  | { type: 'any' }
  | { type: 'tool'; name: string };

type ChatRequest = {
  system?: string;
  messages: InMessage[];
  tools?: InTool[];
  tool_choice?: InToolChoice;
  max_tokens?: number;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// --- Translation: internal -> OpenAI ---------------------------------------

// User-turn content (text + images). tool_result blocks are handled at the
// message level (they translate to separate `tool` role messages), so they're
// ignored here.
function toOpenAIUserContent(
  content: InContent
): OpenAI.Chat.Completions.ChatCompletionContentPart[] | string {
  if (typeof content === 'string') return content;
  const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  for (const block of content) {
    if (block.type === 'text') {
      parts.push({ type: 'text', text: block.text });
    } else if (block.type === 'image') {
      parts.push({
        type: 'image_url',
        image_url: {
          url: `data:${block.source.media_type};base64,${block.source.data}`,
        },
      });
    }
  }
  return parts;
}

// Translates our internal turn list into OpenAI Chat Completions messages.
// The agentic loop interleaves three new shapes that must map precisely:
//   - assistant message with tool_use blocks  -> assistant msg + `tool_calls`
//   - user message with tool_result blocks    -> one `tool` role msg per result
//   - plain user/assistant text (+ images)    -> as before
function toOpenAIMessages(
  system: string | undefined,
  messages: InMessage[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (system) out.push({ role: 'system', content: system });

  for (const m of messages) {
    const blocks = Array.isArray(m.content) ? m.content : null;

    if (m.role === 'assistant') {
      const text =
        typeof m.content === 'string'
          ? m.content
          : (blocks ?? [])
              .filter((b): b is TextBlock => b.type === 'text')
              .map((b) => b.text)
              .join('\n');
      const toolCalls = (blocks ?? [])
        .filter((b): b is ToolUseBlock => b.type === 'tool_use')
        .map((b) => ({
          id: b.id,
          type: 'function' as const,
          function: {
            name: b.name,
            arguments: JSON.stringify(b.input ?? {}),
          },
        }));
      if (toolCalls.length > 0) {
        // OpenAI rejects an assistant message with an empty-string content
        // alongside tool_calls — omit content entirely when there's no text.
        out.push({
          role: 'assistant',
          ...(text ? { content: text } : {}),
          tool_calls: toolCalls,
        });
      } else {
        out.push({ role: 'assistant', content: text });
      }
      continue;
    }

    // role === 'user'
    const toolResults = (blocks ?? []).filter(
      (b): b is ToolResultBlock => b.type === 'tool_result'
    );
    if (toolResults.length > 0) {
      // A tool-result turn carries only tool_result blocks (never text/images),
      // and each becomes its own `tool` message keyed to the originating call.
      for (const r of toolResults) {
        out.push({
          role: 'tool',
          tool_call_id: r.tool_use_id,
          content: r.content,
        });
      }
      continue;
    }

    out.push({ role: 'user', content: toOpenAIUserContent(m.content) });
  }
  return out;
}

function toOpenAITools(
  tools: InTool[] | undefined
): OpenAI.Chat.Completions.ChatCompletionTool[] | undefined {
  return tools?.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

function toOpenAIToolChoice(
  tc: InToolChoice | undefined
): OpenAI.Chat.Completions.ChatCompletionToolChoiceOption | undefined {
  if (!tc) return undefined;
  if (tc.type === 'auto') return 'auto';
  if (tc.type === 'any') return 'required';
  return { type: 'function', function: { name: tc.name } };
}

// --- Translation: OpenAI -> internal ---------------------------------------

function toContentBlocks(
  message: OpenAI.Chat.Completions.ChatCompletionMessage
): Array<TextBlock | ToolUseBlock> {
  const blocks: Array<TextBlock | ToolUseBlock> = [];
  if (typeof message.content === 'string' && message.content.trim()) {
    blocks.push({ type: 'text', text: message.content });
  }
  for (const call of message.tool_calls ?? []) {
    if (call.type !== 'function') continue;
    let input: unknown = {};
    try {
      input = JSON.parse(call.function.arguments || '{}');
    } catch {
      input = {};
    }
    blocks.push({
      type: 'tool_use',
      id: call.id,
      name: call.function.name,
      input,
    });
  }
  return blocks;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // 1. Verify the caller is a signed-in Rinciku user.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // 2. Parse + relay to OpenRouter. The secret comes from env, never the client.
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: 'messages must be a non-empty array' }, 400);
  }

  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set');
    return json({ error: 'AI is not configured.' }, 500);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: { 'X-Title': 'Rinciku' },
  });

  try {
    const completion = await client.chat.completions.create({
      model: Deno.env.get('OPENROUTER_MODEL') ?? DEFAULT_MODEL,
      max_tokens: body.max_tokens ?? DEFAULT_MAX_TOKENS,
      messages: toOpenAIMessages(body.system, body.messages),
      tools: toOpenAITools(body.tools),
      tool_choice: toOpenAIToolChoice(body.tool_choice),
    });

    const choice = completion.choices[0];
    return json({
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
      { error: 'The assistant could not respond. Please try again.' },
      status
    );
  }
});
