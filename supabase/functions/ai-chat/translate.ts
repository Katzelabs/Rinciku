import OpenAI from 'npm:openai';

// The ai-chat feature builds the grounding system prompt + message history
// client-side (RLS-scoped) in our internal "Anthropic-ish" shape; this module
// translates that to OpenAI Chat Completions and back so the client stays
// provider-agnostic.

// --- Internal (client-facing) request shapes -------------------------------

export type TextBlock = { type: 'text'; text: string };
export type ImageBlock = {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
};
export type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
};
// Result of a client-executed (read) tool, replayed back so the model can
// reason over the data it asked for. content is an opaque JSON/text string.
export type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
};
export type InContent =
  | string
  | Array<TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock>;
export type InMessage = { role: 'user' | 'assistant'; content: InContent };
export type InTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};
export type InToolChoice =
  | { type: 'auto' }
  | { type: 'any' }
  | { type: 'tool'; name: string };

export type ChatRequest = {
  system?: string;
  messages: InMessage[];
  tools?: InTool[];
  tool_choice?: InToolChoice;
  max_tokens?: number;
};

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
export function toOpenAIMessages(
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

export function toOpenAITools(
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

export function toOpenAIToolChoice(
  tc: InToolChoice | undefined
): OpenAI.Chat.Completions.ChatCompletionToolChoiceOption | undefined {
  if (!tc) return undefined;
  if (tc.type === 'auto') return 'auto';
  if (tc.type === 'any') return 'required';
  return { type: 'function', function: { name: tc.name } };
}

// --- Translation: OpenAI -> internal ---------------------------------------

export function toContentBlocks(
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
