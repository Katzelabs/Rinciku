import type { Json, Tables } from '@/lib/database.types';
import type { CurrencyCode } from '@/lib/fx';

// Persisted rows.
export type Conversation = Tables<'conversations'>;
export type ChatMessageRow = Tables<'messages'>;

// Lightweight thread item rendered in the UI (persisted rows + optimistic ones).
export type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// --- Minimal Anthropic wire shapes ----------------------------------------
// Local definitions so the SDK never enters the browser bundle (it runs only in
// the Deno edge function). Mirror the subset of the Messages API we use.

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

export type ContentBlock = TextBlock | ToolUseBlock;

export type MessageParam = {
  role: 'user' | 'assistant';
  content: string | Array<TextBlock | ImageBlock | ToolUseBlock>;
};

export type ToolDef = {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export type ToolChoice =
  | { type: 'auto' }
  | { type: 'any' }
  | { type: 'tool'; name: string };

// Shape the ai-chat edge function returns (or `{ error }` on failure).
export type ChatResponse = {
  content?: ContentBlock[];
  stop_reason?: string | null;
  usage?: { input_tokens: number; output_tokens: number } | null;
  model?: string;
  error?: string;
};

// --- Transaction proposals (chat & image logging) -------------------------

export type ProposalKind = 'expense' | 'income';

export type DocType =
  | 'receipt'
  | 'transfer'
  | 'invoice'
  | 'ewallet'
  | 'unknown';

// Normalized output of a propose_expense / propose_income tool call.
export type ProposedTransaction = {
  kind: ProposalKind;
  amount: number;
  currency: CurrencyCode;
  category_hint: string | null;
  occurred_at: string; // YYYY-MM-DD
  note: string | null;
  confidence: number | null;
  doc_type: DocType;
  // The raw tool input, persisted to *_attachments.ai_raw_extraction on confirm.
  raw: Json;
};

// Image attachment created up front, linked to the record on confirm.
export type PendingAttachment = {
  id: string;
  kind: ProposalKind;
};
