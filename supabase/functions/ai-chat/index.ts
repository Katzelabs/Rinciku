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
const DEFAULT_MAX_TOKENS = 2048;

// --- Internal (client-facing) request shapes -------------------------------

type TextBlock = { type: 'text'; text: string };
type ImageBlock = {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
};
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: unknown };
type InContent = string | Array<TextBlock | ImageBlock | ToolUseBlock>;
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

function toOpenAIContent(
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
    // tool_use blocks are never sent from the client (history is text-only).
  }
  return parts;
}

function toOpenAIMessages(
  system: string | undefined,
  messages: InMessage[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (system) out.push({ role: 'system', content: system });
  for (const m of messages) {
    if (m.role === 'assistant') {
      // Assistant history is always plain text in this app.
      out.push({
        role: 'assistant',
        content:
          typeof m.content === 'string'
            ? m.content
            : m.content
                .filter((b): b is TextBlock => b.type === 'text')
                .map((b) => b.text)
                .join('\n'),
      });
    } else {
      out.push({ role: 'user', content: toOpenAIContent(m.content) });
    }
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
