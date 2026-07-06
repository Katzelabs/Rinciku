import type { Json, Tables } from '@rinciku/db';
import type { CurrencyCode } from '@rinciku/core';

// Persisted rows.
export type Conversation = Tables<'conversations'>;
export type ChatMessageRow = Tables<'messages'>;

// A conversation plus a preview of its most-recent message, for the history
// list. `last_message_preview` is the plain-text `content` of the latest message
// (or null for an empty conversation); derived from a limit-1 embed in
// `listConversations`, not a stored column.
export type ConversationListItem = Conversation & {
  last_message_preview: string | null;
};

// A message row plus its linked image attachment (if any). The FK
// messages.attachment_id references expense_attachments, so the embed is a
// single row or null.
export type ChatMessageRowWithImage = ChatMessageRow & {
  attachment: { storage_path: string } | null;
};

// Lightweight thread item rendered in the UI (persisted rows + optimistic ones).
export type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  // Displayable URL for an attached image (object URL while optimistic, signed
  // storage URL once reloaded from history). Null for text-only messages.
  imageUrl?: string | null;
};

// --- Minimal Anthropic wire shapes ----------------------------------------
// Local definitions so the SDK never enters the client bundle (it runs only in
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

// Result of a client-executed read tool, replayed to the model so it can reason
// over the data it asked for. `content` is an opaque JSON/text string.
export type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
};

export type ContentBlock = TextBlock | ToolUseBlock;

export type MessageParam = {
  role: 'user' | 'assistant';
  content:
    | string
    | Array<TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock>;
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

// --- Generic data mutations (agent CRUD) ----------------------------------
// Non-transaction writes (and expense/income edits/deletes) flow through one
// generic proposal tool. The model resolves concrete ids via read tools first,
// then proposes a change the user confirms in a single action card.

export type ChangeAction = 'create' | 'update' | 'delete';

export type ChangeEntity =
  | 'expense'
  | 'income'
  | 'category'
  | 'income_category'
  | 'essential'
  | 'budget'
  | 'tier';

// Normalized output of a propose_change tool call.
export type ProposedChange = {
  action: ChangeAction;
  entity: ChangeEntity;
  // Required for update/delete; null for create.
  id: string | null;
  // Fields to set for create/update; null for delete.
  data: Record<string, unknown> | null;
  // Human-readable one-liner the model writes for the confirmation card.
  summary: string;
};
