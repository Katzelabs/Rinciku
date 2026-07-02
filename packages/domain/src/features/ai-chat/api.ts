import type { PostgrestError } from '@supabase/supabase-js';
import type { Json, TypedSupabaseClient } from '@rinciku/db';
import {
  formatCurrency,
  type CurrencyCode,
} from '@rinciku/core';

import type { Profile } from '../auth';
import { createDashboardApi, type MonthlySummary } from '../dashboard';
import { createExpensesApi } from '../expenses';
import { createIncomesApi } from '../incomes';
import { createCategoriesApi } from '../categories';
import { createEssentialsApi } from '../essentials';
import { createBudgetsApi } from '../budgets';
import { createAgentTools } from './agent-tools';
import { buildSystemPrompt } from './prompt';
import { runAgentTurn as runAgentTurnPure } from './run-turn';
import { proposalToolInputSchema } from './schemas';
import type {
  ChatMessageRow,
  ChatMessageRowWithImage,
  ChatResponse,
  Conversation,
  ImageBlock,
  MessageParam,
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

/**
 * Portable ai-chat data + agent layer, shared by web + mobile. The Supabase
 * client is injected, so the same conversation CRUD, LLM proxy, budget
 * grounding, agentic tool loop, and confirm handlers run on both platforms.
 * Platform-specific image capture (File/FileReader, expo-image-picker) stays in
 * each app.
 */
export function createAiChatApi(db: TypedSupabaseClient) {
  const dashboard = createDashboardApi(db);
  const expenses = createExpensesApi(db);
  const incomes = createIncomesApi(db);
  const categories = createCategoriesApi(db);
  const essentials = createEssentialsApi(db);
  const budgets = createBudgetsApi(db);

  const { executeReadTool, applyProposedChange } = createAgentTools({
    dashboard,
    expenses,
    incomes,
    categories,
    essentials,
    budgets,
  });

  // --- Conversations & messages (RLS-scoped) -------------------------------

  async function listConversations(): Promise<Result<Conversation[]>> {
    const { data, error } = await db
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async function createConversation(
    userId: string,
    title: string | null = null
  ): Promise<Result<Conversation>> {
    const { data, error } = await db
      .from('conversations')
      .insert({ user_id: userId, title })
      .select('*')
      .single();
    return { data, error };
  }

  async function getMessages(
    conversationId: string
  ): Promise<Result<ChatMessageRowWithImage[]>> {
    const { data, error } = await db
      .from('messages')
      .select('*, attachment:expense_attachments(storage_path)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    return { data: data as ChatMessageRowWithImage[] | null, error };
  }

  // Resolves a time-limited URL the client can render for a stored chat image.
  // Returns null on failure so a broken attachment never blocks the thread.
  async function chatImageUrl(storagePath: string): Promise<string | null> {
    const { data } = await expenses.getAttachmentSignedUrl(
      storagePath,
      60 * 60
    );
    return data?.signedUrl ?? null;
  }

  async function appendMessage(
    input: AppendMessageInput
  ): Promise<Result<ChatMessageRow>> {
    const { data, error } = await db
      .from('messages')
      .insert(input)
      .select('*')
      .single();
    return { data, error };
  }

  async function touchConversation(
    id: string,
    patch: { title?: string | null; last_message_at?: string }
  ): Promise<Result<Conversation>> {
    const { data, error } = await db
      .from('conversations')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    return { data, error };
  }

  async function deleteConversation(id: string): Promise<Result<null>> {
    const { error } = await db.from('conversations').delete().eq('id', id);
    return { data: null, error };
  }

  // --- Grounding -----------------------------------------------------------

  // Reuses the dashboard's cycle- & FX-aware summary, then formats it into the
  // system prompt. Computed client-side to reuse all existing aggregation; the
  // data is the user's own RLS-scoped state.
  async function buildBudgetContext(
    profile: Profile
  ): Promise<Result<{ system: string; summary: MonthlySummary }>> {
    const { data, error } = await dashboard.getMonthlySummary(profile);
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

  // --- LLM proxy -----------------------------------------------------------

  async function sendChat(req: {
    system: string;
    messages: MessageParam[];
    tools?: ToolDef[];
    tool_choice?: ToolChoice;
  }): Promise<ChatResponse> {
    const { data, error } = await db.functions.invoke<ChatResponse>('ai-chat', {
      body: req,
    });
    if (error) {
      return { error: error.message ?? 'The assistant could not respond.' };
    }
    return data ?? { error: 'Empty response from the assistant.' };
  }

  // --- Agentic loop (bound) ------------------------------------------------

  function runAgentTurn(
    params: {
      system: string;
      history: MessageParam[];
      apiContent: Array<TextBlock | ImageBlock>;
      toolChoice: ToolChoice;
      profile: Profile;
    },
    opts?: { noResponseMessage?: string }
  ): Promise<ChatResponse> {
    return runAgentTurnPure(params, {
      sendChat,
      executeReadTool,
      noResponseMessage: opts?.noResponseMessage,
    });
  }

  // --- Confirm proposals ---------------------------------------------------

  async function confirmExpenseProposal(
    input: ConfirmBase & { categoryId: string }
  ): Promise<Result<{ id: string }>> {
    const { data, error } = await expenses.createExpense({
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
      await expenses.updateAttachment(input.attachment.id, {
        expense_id: data.id,
        confirmed: true,
        ai_raw_extraction: input.attachment.raw,
        ai_confidence: input.attachment.confidence,
        doc_type: input.attachment.docType,
      });
    }
    return { data: { id: data.id }, error: null };
  }

  async function confirmIncomeProposal(
    input: ConfirmBase & { sourceId: string | null }
  ): Promise<Result<{ id: string }>> {
    const { data, error } = await incomes.createIncome({
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
      await incomes.updateIncomeAttachment(input.attachment.id, {
        income_id: data.id,
        confirmed: true,
        ai_raw_extraction: input.attachment.raw,
        ai_confidence: input.attachment.confidence,
        doc_type: input.attachment.docType,
      });
    }
    return { data: { id: data.id }, error: null };
  }

  return {
    listConversations,
    createConversation,
    getMessages,
    chatImageUrl,
    appendMessage,
    touchConversation,
    deleteConversation,
    buildBudgetContext,
    sendChat,
    executeReadTool,
    applyProposedChange,
    runAgentTurn,
    confirmExpenseProposal,
    confirmIncomeProposal,
  };
}

export type AiChatApi = ReturnType<typeof createAiChatApi>;

// --- Pure response parsing (no db) -----------------------------------------

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
