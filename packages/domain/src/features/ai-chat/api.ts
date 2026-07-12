import type { PostgrestError } from '@supabase/supabase-js';
import type { Json, TypedSupabaseClient } from '@rinciku/db';
import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import type { Profile } from '../auth';
import { createDashboardApi, type MonthlySummary } from '../dashboard';
import { createExpensesApi } from '../expenses';
import { createIncomesApi } from '../incomes';
import { createCategoriesApi } from '../categories';
import { createEssentialsApi } from '../essentials';
import { createBudgetsApi } from '../budgets';
import { createAgentTools, TRANSACTION_TOOLS } from './agent-tools';
import { createExportTools } from './export';
import { buildScanSystemPrompt, SCAN_USER_INSTRUCTION } from './extract';
import {
  buildSummaryUserMessage,
  buildSystemPrompt,
  SUMMARY_SYSTEM_PROMPT,
} from './prompt';
import { HISTORY_WINDOW, runAgentTurn as runAgentTurnPure } from './run-turn';
import { proposalToolInputSchema } from './schemas';
import type {
  ChangeTarget,
  ChangeTargetRecord,
  ChatMessageRow,
  ChatMessageRowWithImage,
  ChatResponse,
  Conversation,
  ConversationListItem,
  ImageBlock,
  MessageParam,
  ProposalKind,
  ProposedChange,
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

// Newest-first page size for thread loading; one page always covers the LLM
// history window (HISTORY_WINDOW in run-turn.ts).
export const MESSAGES_PAGE_SIZE = 50;
export const CONVERSATIONS_PAGE_SIZE = 30;

// Refresh the running summary once this many messages sit beyond its anchor —
// the newest HISTORY_WINDOW stay verbatim, so it re-triggers only every ~5
// turns rather than on each one.
export const SUMMARY_TRIGGER = 40;
export const SUMMARY_MAX_TOKENS = 1024;

// Keyset cursor into a conversation's messages: created_at with the row id as
// tiebreaker (timestamps can collide under rapid inserts).
export type MessageCursor = { created_at: string; id: string };

export type MessagesPage = {
  // Ascending within the page (oldest → newest), for direct rendering.
  data: ChatMessageRowWithImage[] | null;
  // Total messages in the conversation (count: 'exact').
  count: number | null;
  // Pass as `before` to fetch the next OLDER page; null = no more.
  nextCursor: MessageCursor | null;
  error: PostgrestError | null;
};

export type ConversationsPage = {
  data: ConversationListItem[] | null;
  count: number | null;
  error: PostgrestError | null;
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

  const apis = {
    dashboard,
    expenses,
    incomes,
    categories,
    essentials,
    budgets,
  };
  const { executeReadTool, applyProposedChange } = createAgentTools(apis);
  const { resolveExport, buildExportFiles } = createExportTools(apis);

  // --- Conversations & messages (RLS-scoped) -------------------------------

  async function listConversations(
    params: { limit?: number; offset?: number } = {}
  ): Promise<ConversationsPage> {
    const { limit = CONVERSATIONS_PAGE_SIZE, offset = 0 } = params;
    // Embed only the newest message per conversation (limit-1 on the referenced
    // table) for the history-list preview. `content` is stored as plain display
    // text, so no block parsing is needed. Portable: web + mobile share this.
    // Offset paging (mirrors listExpenses) — the list is low-churn and the
    // consumer dedupes by id, absorbing rows that shift between pages.
    const { data, error, count } = await db
      .from('conversations')
      .select('*, messages(content, created_at)', { count: 'exact' })
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'messages', ascending: false })
      .limit(1, { referencedTable: 'messages' })
      .range(offset, offset + limit - 1);
    if (error || !data) return { data: null, count: null, error };
    const items: ConversationListItem[] = data.map((row) => {
      const { messages, ...conversation } = row as Conversation & {
        messages: { content: string; created_at: string }[] | null;
      };
      return {
        ...conversation,
        last_message_preview: messages?.[0]?.content ?? null,
      };
    });
    return { data: items, count, error: null };
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

  // Newest-first keyset pagination over (created_at desc, id desc) — served by
  // the (conversation_id, created_at) index. Pages are returned ascending so
  // the caller can render (or prepend) them directly.
  async function getMessages(
    conversationId: string,
    opts: { limit?: number; before?: MessageCursor } = {}
  ): Promise<MessagesPage> {
    const { limit = MESSAGES_PAGE_SIZE, before } = opts;
    let query = db
      .from('messages')
      .select('*, attachment:expense_attachments(storage_path)', {
        count: 'exact',
      })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    if (before) {
      // Strictly-older-than-cursor. Values are double-quoted: ISO timestamps
      // contain `+`/`:` which PostgREST's or= parser mangles unquoted.
      query = query.or(
        `created_at.lt."${before.created_at}",and(created_at.eq."${before.created_at}",id.lt."${before.id}")`
      );
    }
    const { data, error, count } = await query;
    if (error || !data)
      return { data: null, count: null, nextCursor: null, error };
    const rows = (data as ChatMessageRowWithImage[]).reverse();
    const oldest = rows[0];
    const nextCursor =
      rows.length === limit && oldest
        ? { created_at: oldest.created_at, id: oldest.id }
        : null;
    return { data: rows, count, nextCursor, error: null };
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

  // Batch counterpart: one storage round-trip per page of messages. Paths that
  // fail to sign map to null so a broken attachment never blocks the thread.
  async function chatImageUrls(
    storagePaths: string[]
  ): Promise<Map<string, string | null>> {
    const urls = new Map<string, string | null>();
    if (storagePaths.length === 0) return urls;
    const { data } = await expenses.getAttachmentSignedUrls(
      storagePaths,
      60 * 60
    );
    for (const path of storagePaths) {
      urls.set(path, data?.get(path) ?? null);
    }
    return urls;
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

  // --- Running summary -------------------------------------------------------

  async function getConversationSummary(
    id: string
  ): Promise<
    Result<{ summary: string | null; summary_message_count: number }>
  > {
    const { data, error } = await db
      .from('conversations')
      .select('summary, summary_message_count')
      .eq('id', id)
      .single();
    return { data, error };
  }

  async function updateConversationSummary(
    id: string,
    patch: { summary: string; summary_message_count: number }
  ): Promise<Result<null>> {
    const { error } = await db.from('conversations').update(patch).eq('id', id);
    return { data: null, error };
  }

  // Conversations with a summary refresh already running this session; a
  // overlapping call for the same thread is a no-op instead of a duplicate
  // LLM request.
  const summarizing = new Set<string>();

  // Folds messages older than the verbatim window into the conversation's
  // running summary. Fire-and-forget: called after a turn completes, never
  // throws — a failed refresh just retries after the next turn.
  async function maybeSummarizeConversation(
    conversationId: string
  ): Promise<void> {
    if (summarizing.has(conversationId)) return;
    summarizing.add(conversationId);
    try {
      const { data: current } = await getConversationSummary(conversationId);
      if (!current) return;

      const { count } = await db
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);
      if (count == null) return;

      // Only refresh once enough un-summarized messages sit beyond the anchor;
      // the newest HISTORY_WINDOW always stay verbatim.
      if (count - current.summary_message_count <= SUMMARY_TRIGGER) return;
      const summarizeUpto = count - HISTORY_WINDOW;

      // The delta since the last anchor. Messages are immutable + append-only,
      // so ascending offsets are stable.
      const { data: delta, error: deltaError } = await db
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(current.summary_message_count, summarizeUpto - 1);
      if (deltaError || !delta || delta.length === 0) return;

      const res = await sendChat({
        system: SUMMARY_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildSummaryUserMessage(current.summary, delta),
          },
        ],
        max_tokens: SUMMARY_MAX_TOKENS,
      });
      if (res.error) return;
      const summary = extractText(res);
      if (!summary) return;

      await updateConversationSummary(conversationId, {
        summary,
        summary_message_count: summarizeUpto,
      });
    } catch (err) {
      // Never surface: the turn already succeeded; the next turn retries.
      console.error('ai-chat summary refresh failed', err);
    } finally {
      summarizing.delete(conversationId);
    }
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
    max_tokens?: number;
  }): Promise<ChatResponse> {
    const { data, error } = await db.functions.invoke<ChatResponse>('ai-chat', {
      body: req,
    });
    if (error) {
      return { error: error.message ?? 'The assistant could not respond.' };
    }
    return data ?? { error: 'Empty response from the assistant.' };
  }

  // --- One-shot scan extraction (bound) -------------------------------------

  // Scan-to-prefill: send the image once with the matching propose_* tool
  // FORCED, so the reply is a structured extraction rather than prose. No
  // thread, no loop — the parsed proposal prefills the add form for review.
  async function extractTransactionFromImage(params: {
    kind: ProposalKind;
    image: { media_type: string; data: string };
    baseCurrency: CurrencyCode;
  }): Promise<{ data: ProposedTransaction | null; error: string | null }> {
    const toolName =
      params.kind === 'income' ? 'propose_income' : 'propose_expense';
    const tool = TRANSACTION_TOOLS.find((t) => t.name === toolName);
    if (!tool) return { data: null, error: `Unknown tool: ${toolName}` };
    const res = await sendChat({
      system: buildScanSystemPrompt(params.baseCurrency),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: params.image.media_type,
                data: params.image.data,
              },
            },
            { type: 'text', text: SCAN_USER_INSTRUCTION },
          ],
        },
      ],
      tools: [tool],
      tool_choice: { type: 'tool', name: toolName },
      max_tokens: 1024,
    });
    if (res.error) return { data: null, error: res.error };
    const proposal = parseProposal(res);
    // amount <= 0 is the prompt's "unreadable / not a financial document"
    // signal — treat it as a failed scan rather than prefilling zeros.
    if (!proposal || proposal.amount <= 0) {
      return {
        data: null,
        error: 'Could not read a transaction from the image.',
      };
    }
    return { data: proposal, error: null };
  }

  // --- Agentic loop (bound) ------------------------------------------------

  function runAgentTurn(
    params: {
      system: string;
      history: MessageParam[];
      apiContent: Array<TextBlock | ImageBlock>;
      toolChoice: ToolChoice;
      profile: Profile;
      summary?: string | null;
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

  // --- Change-target resolution (ground truth for the action card) ---------

  // Fetches the actual row an update/delete proposal points at so the
  // confirmation card shows the real record identity instead of trusting the
  // model-written summary (the summary could name one record while `id` points
  // at another). Fails closed: a target that cannot be verified comes back as
  // 'missing'/'unverified' and the card disables confirm.
  async function resolveChangeTarget(
    change: ProposedChange
  ): Promise<ProposedChange> {
    if (change.action === 'create') return { ...change, target: null };
    if (!change.id) return { ...change, target: { status: 'missing' } };
    try {
      const target = await fetchChangeTarget(
        change.entity,
        change.id,
        change.data
      );
      // Budget deletes often arrive with no data, and applyProposedChange picks
      // the table (budgets vs tier_budgets) from data.scope/tier_id — pin the
      // scope the id actually resolved to so apply hits the row the card shows.
      const data = (() => {
        if (
          change.entity !== 'budget' ||
          change.action !== 'delete' ||
          target.status !== 'found' ||
          !target.record.scope
        )
          return change.data;
        const patched: Record<string, unknown> = {
          ...(change.data ?? {}),
          scope: target.record.scope,
        };
        // A stray tier_id would override scope in the apply dispatcher.
        if (target.record.scope === 'category') delete patched.tier_id;
        return patched;
      })();
      return { ...change, data, target };
    } catch {
      return { ...change, target: { status: 'unverified' } };
    }
  }

  async function fetchChangeTarget(
    entity: ProposedChange['entity'],
    id: string,
    data: Record<string, unknown> | null
  ): Promise<ChangeTarget> {
    const empty: ChangeTargetRecord = {
      name: null,
      amount: null,
      currency: null,
      occurred_at: null,
      period: null,
    };
    const found = (record: Partial<ChangeTargetRecord>): ChangeTarget => ({
      status: 'found',
      record: { ...empty, ...record },
    });

    switch (entity) {
      case 'expense':
      case 'income': {
        const { data: row, error } = await db
          .from(entity === 'expense' ? 'expenses' : 'incomes')
          .select('note, amount, currency, occurred_at')
          .eq('id', id)
          .maybeSingle();
        if (error) return { status: 'unverified' };
        if (!row) return { status: 'missing' };
        return found({
          name: row.note,
          amount: Number(row.amount),
          currency: row.currency,
          occurred_at: row.occurred_at,
        });
      }

      case 'category':
      case 'income_category':
      case 'tier': {
        const table =
          entity === 'category'
            ? 'categories'
            : entity === 'income_category'
              ? 'income_categories'
              : 'tiers';
        const { data: row, error } = await db
          .from(table)
          .select('name')
          .eq('id', id)
          .maybeSingle();
        if (error) return { status: 'unverified' };
        if (!row) return { status: 'missing' };
        return found({ name: row.name });
      }

      case 'essential': {
        const { data: row, error } = await db
          .from('essentials')
          .select('name, estimated_amount, currency')
          .eq('id', id)
          .maybeSingle();
        if (error) return { status: 'unverified' };
        if (!row) return { status: 'missing' };
        return found({
          name: row.name,
          amount: Number(row.estimated_amount),
          currency: row.currency,
        });
      }

      case 'budget': {
        // A budget id lives in `budgets` (per-category) or `tier_budgets`
        // (per-tier). The proposal's data may hint the scope, but deletes often
        // carry no data — check both tables, hinted one first.
        const period = (y: number, m: number) =>
          `${y}-${String(m).padStart(2, '0')}`;
        const fromCategoryBudgets = async (): Promise<ChangeTarget> => {
          const { data: row, error } = await db
            .from('budgets')
            .select(
              'amount, currency, period_year, period_month, categories(name)'
            )
            .eq('id', id)
            .maybeSingle();
          if (error) return { status: 'unverified' };
          if (!row) return { status: 'missing' };
          return found({
            name: row.categories?.name ?? null,
            amount: Number(row.amount),
            currency: row.currency,
            period: period(row.period_year, row.period_month),
            scope: 'category',
          });
        };
        const fromTierBudgets = async (): Promise<ChangeTarget> => {
          const { data: row, error } = await db
            .from('tier_budgets')
            .select('amount, currency, period_year, period_month, tiers(name)')
            .eq('id', id)
            .maybeSingle();
          if (error) return { status: 'unverified' };
          if (!row) return { status: 'missing' };
          return found({
            name: row.tiers?.name ?? null,
            amount: Number(row.amount),
            currency: row.currency,
            period: period(row.period_year, row.period_month),
            scope: 'tier',
          });
        };
        const tierFirst =
          data?.scope === 'tier' || typeof data?.tier_id === 'string';
        const first = tierFirst ? fromTierBudgets : fromCategoryBudgets;
        const second = tierFirst ? fromCategoryBudgets : fromTierBudgets;
        const hit = await first();
        return hit.status === 'missing' ? second() : hit;
      }
    }
  }

  return {
    listConversations,
    createConversation,
    getMessages,
    chatImageUrl,
    chatImageUrls,
    appendMessage,
    touchConversation,
    deleteConversation,
    getConversationSummary,
    updateConversationSummary,
    maybeSummarizeConversation,
    buildBudgetContext,
    sendChat,
    extractTransactionFromImage,
    executeReadTool,
    applyProposedChange,
    resolveChangeTarget,
    resolveExport,
    buildExportFiles,
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
