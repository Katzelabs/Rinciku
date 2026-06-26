import type { PostgrestError } from '@supabase/supabase-js';
import type { Json } from '@/lib/database.types';
import { CURRENCY_CODES, type CurrencyCode } from '@/lib/fx';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/features/auth';
import {
  getMonthlySummary,
  type MonthlySummary,
} from '@/features/dashboard/api';
import {
  createAttachment,
  createExpense,
  updateAttachment,
  uploadAttachment,
} from '@/features/expenses/api';
import {
  createIncome,
  createIncomeAttachment,
  updateIncomeAttachment,
  uploadIncomeAttachment,
} from '@/features/incomes/api';
import { proposalToolInputSchema } from './schemas';
import type {
  ChatMessageRow,
  ChatResponse,
  Conversation,
  MessageParam,
  PendingAttachment,
  ProposalKind,
  ProposedTransaction,
  TextBlock,
  ToolChoice,
  ToolDef,
  ToolUseBlock,
} from './types';

type Result<T> = {
  data: T | null;
  error: PostgrestError | Error | null;
};

// --- Conversations & messages (RLS-scoped) ---------------------------------

export async function listConversations(): Promise<Result<Conversation[]>> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createConversation(
  userId: string,
  title: string | null = null
): Promise<Result<Conversation>> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title })
    .select('*')
    .single();
  return { data, error };
}

export async function getMessages(
  conversationId: string
): Promise<Result<ChatMessageRow[]>> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return { data, error };
}

export type AppendMessageInput = {
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment_id?: string | null;
  model?: string | null;
  tokens_input?: number | null;
  tokens_output?: number | null;
};

export async function appendMessage(
  input: AppendMessageInput
): Promise<Result<ChatMessageRow>> {
  const { data, error } = await supabase
    .from('messages')
    .insert(input)
    .select('*')
    .single();
  return { data, error };
}

export async function touchConversation(
  id: string,
  patch: { title?: string | null; last_message_at?: string }
): Promise<Result<Conversation>> {
  const { data, error } = await supabase
    .from('conversations')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  return { data, error };
}

export async function deleteConversation(id: string): Promise<Result<null>> {
  const { error } = await supabase.from('conversations').delete().eq('id', id);
  return { data: null, error };
}

// --- Grounding -------------------------------------------------------------

// Reuses the dashboard's cycle- & FX-aware summary, then formats it into the
// system prompt. Computing this client-side reuses all existing aggregation
// logic; the data is the user's own RLS-scoped state, so there's nothing gained
// by recomputing it server-side.
export async function buildBudgetContext(
  profile: Profile
): Promise<Result<{ system: string; summary: MonthlySummary }>> {
  const { data, error } = await getMonthlySummary(profile);
  if (error || !data) {
    return {
      data: null,
      error: error ?? new Error('Could not load budget state'),
    };
  }
  return {
    data: { system: buildSystemPrompt(data), summary: data },
    error: null,
  };
}

function buildSystemPrompt(s: MonthlySummary): string {
  const base = s.base_currency;
  const fmt = (n: number) => formatCurrency(n, base);
  const tierLines =
    s.tiers
      .map((t) => `  - ${t.name}: ${fmt(s.by_tier[t.id] ?? 0)}`)
      .join('\n') || '  - (no spending categorized yet)';
  const cycleStart = isoDate(s.cycle.start);
  const cycleEnd = isoDate(s.cycle.end);

  return [
    'You are Rinciku, a warm but honest personal-finance companion for a user with mixed IDR/USD income and variable monthly expenses.',
    "Give grounded, specific guidance from the user's real budget state below — never generic financial advice. Be concise and direct. Amounts are in the user's base currency. When the base is IDR, use Rupiah formatting (e.g. Rp 1.500.000).",
    '',
    'When the user asks whether they can afford a purchase, reason explicitly against their remaining budget, the still-uncovered essentials baseline, and the days left in the cycle. Give a clear yes / no / maybe with the numbers behind it.',
    'When the user states a transaction in natural language (e.g. "spent 45k on lunch", "got paid 2 million") OR sends an image of a receipt, transfer proof, invoice, or e-wallet screenshot, call the matching tool (propose_expense or propose_income) to draft it for review. Do NOT claim it is logged — the user confirms in the UI. Indonesian amounts use dot thousands separators (e.g. "45.000" = 45000, "1,2jt" = 1200000).',
    '',
    `Current budget state (base currency: ${base}):`,
    `- Cycle: ${cycleStart} to ${cycleEnd} (${s.days_left} day(s) left)`,
    `- Expected monthly income: ${fmt(s.expected_monthly_income)}`,
    `- Income received so far: ${fmt(s.income_received)}`,
    `- Spent so far: ${fmt(s.spent_total)}`,
    `- Remaining (expected income minus spent): ${fmt(s.remaining)}`,
    `- Essentials baseline (monthly floor): ${fmt(s.baseline_total)}`,
    `- Essentials still uncovered this cycle: ${fmt(s.baseline_uncovered)}`,
    '- Spending by tier:',
    tierLines,
  ].join('\n');
}

// --- Claude proxy ----------------------------------------------------------

export async function sendChat(req: {
  system: string;
  messages: MessageParam[];
  tools?: ToolDef[];
  tool_choice?: ToolChoice;
}): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke<ChatResponse>(
    'ai-chat',
    { body: req }
  );
  if (error) {
    return { error: error.message ?? 'The assistant could not respond.' };
  }
  return data ?? { error: 'Empty response from the assistant.' };
}

const PROPOSAL_PROPS = {
  amount: {
    type: 'number',
    description: 'Amount as a plain number (e.g. 45000 for "45k" / "45.000").',
  },
  currency: {
    type: 'string',
    enum: CURRENCY_CODES,
    description: 'ISO currency code, e.g. IDR or USD.',
  },
  category_hint: {
    type: 'string',
    description:
      'Best-guess category name (e.g. "Food", "Transport"). The user picks the final category.',
  },
  occurred_at: {
    type: 'string',
    description: 'Date as YYYY-MM-DD. Default to today if unknown.',
  },
  note: { type: 'string', description: 'Short description or merchant name.' },
  confidence: {
    type: 'number',
    description: '0 to 1 confidence in the extraction.',
  },
  doc_type: {
    type: 'string',
    enum: ['receipt', 'transfer', 'invoice', 'ewallet', 'unknown'],
    description: 'Document type when from an image; "unknown" for typed text.',
  },
} as const;

export const TRANSACTION_TOOLS: ToolDef[] = [
  {
    name: 'propose_expense',
    description:
      'Draft an expense for the user to review and confirm. Use when the user describes money they spent, or sends a receipt / payment image.',
    input_schema: {
      type: 'object',
      properties: PROPOSAL_PROPS,
      required: ['amount', 'currency'],
    },
  },
  {
    name: 'propose_income',
    description:
      'Draft an income entry for the user to review and confirm. Use when the user describes money they received, or sends a transfer-in / payslip image.',
    input_schema: {
      type: 'object',
      properties: PROPOSAL_PROPS,
      required: ['amount', 'currency'],
    },
  },
];

// --- Response parsing ------------------------------------------------------

export function extractText(res: ChatResponse): string {
  return (res.content ?? [])
    .filter((b): b is TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

export function parseProposal(res: ChatResponse): ProposedTransaction | null {
  const block = (res.content ?? []).find(
    (b): b is ToolUseBlock =>
      b.type === 'tool_use' &&
      (b.name === 'propose_expense' || b.name === 'propose_income')
  );
  if (!block) return null;
  const parsed = proposalToolInputSchema.safeParse(block.input);
  if (!parsed.success) return null;
  const v = parsed.data;
  return {
    kind: block.name === 'propose_income' ? 'income' : 'expense',
    amount: v.amount,
    currency: v.currency as CurrencyCode,
    category_hint: v.category_hint ?? null,
    occurred_at: normalizeDate(v.occurred_at),
    note: v.note ?? null,
    confidence: v.confidence ?? null,
    doc_type: v.doc_type ?? 'unknown',
    raw: (block.input ?? null) as Json,
  };
}

export function summarizeProposal(p: ProposedTransaction): string {
  const noun = p.kind === 'income' ? 'an income' : 'an expense';
  const tail = p.note ? ` — ${p.note}` : '';
  return `Drafted ${noun} of ${formatCurrency(p.amount, p.currency)}${tail} for you to review below.`;
}

export function conversationTitleFrom(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return 'New chat';
  return clean.length > 48 ? `${clean.slice(0, 47)}…` : clean;
}

// --- Image extraction ------------------------------------------------------

export function fileToBase64(
  file: File
): Promise<{ media_type: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve({ media_type: file.type, data: result.slice(comma + 1) });
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

// Uploads the image to the bucket matching the resolved kind and records the
// attachment row. Called after extraction so we know whether it's an expense or
// income document (the two live in separate tables/buckets).
export async function createImageAttachment(
  file: File,
  kind: ProposalKind,
  userId: string
): Promise<Result<PendingAttachment>> {
  const occurredAt = new Date();
  if (kind === 'expense') {
    const up = await uploadAttachment(file, { userId, occurredAt });
    if (up.error || !up.data) return { data: null, error: up.error };
    const row = await createAttachment({
      user_id: userId,
      storage_path: up.data.storage_path,
      mime_type: file.type,
      file_size_bytes: file.size,
    });
    if (row.error || !row.data) return { data: null, error: row.error };
    return { data: { id: row.data.id, kind }, error: null };
  }
  const up = await uploadIncomeAttachment(file, { userId, occurredAt });
  if (up.error || !up.data) return { data: null, error: up.error };
  const row = await createIncomeAttachment({
    user_id: userId,
    storage_path: up.data.storage_path,
    mime_type: file.type,
    file_size_bytes: file.size,
  });
  if (row.error || !row.data) return { data: null, error: row.error };
  return { data: { id: row.data.id, kind }, error: null };
}

// --- Confirm proposals -----------------------------------------------------

export type ConfirmAttachment = {
  id: string;
  raw: Json;
  confidence: number | null;
  docType: string;
};

export type ConfirmBase = {
  userId: string;
  amount: number;
  currency: CurrencyCode;
  occurredAt: string; // YYYY-MM-DD
  note: string | null;
  source: 'chat' | 'image';
  attachment?: ConfirmAttachment | null;
};

export async function confirmExpenseProposal(
  input: ConfirmBase & { categoryId: string }
): Promise<Result<{ id: string }>> {
  const { data, error } = await createExpense({
    user_id: input.userId,
    amount: input.amount,
    currency: input.currency,
    category_id: input.categoryId,
    occurred_at: input.occurredAt,
    note: input.note,
    source: input.source,
    attachment_id: input.attachment?.id ?? null,
  });
  if (error || !data) return { data: null, error };
  if (input.attachment) {
    await updateAttachment(input.attachment.id, {
      expense_id: data.id,
      confirmed: true,
      ai_raw_extraction: input.attachment.raw,
      ai_confidence: input.attachment.confidence,
      doc_type: input.attachment.docType,
    });
  }
  return { data: { id: data.id }, error: null };
}

export async function confirmIncomeProposal(
  input: ConfirmBase & { sourceId: string | null }
): Promise<Result<{ id: string }>> {
  const { data, error } = await createIncome({
    user_id: input.userId,
    source_id: input.sourceId,
    amount: input.amount,
    currency: input.currency,
    occurred_at: input.occurredAt,
    note: input.note,
    source: input.source,
    attachment_id: input.attachment?.id ?? null,
  });
  if (error || !data) return { data: null, error };
  if (input.attachment) {
    await updateIncomeAttachment(input.attachment.id, {
      income_id: data.id,
      confirmed: true,
      ai_raw_extraction: input.attachment.raw,
      ai_confidence: input.attachment.confidence,
      doc_type: input.attachment.docType,
    });
  }
  return { data: { id: data.id }, error: null };
}

// --- helpers ---------------------------------------------------------------

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeDate(value: string | null | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return value;
  }
  return isoDate(new Date());
}
