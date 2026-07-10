import type { PostgrestError } from '@supabase/supabase-js';
import { createAiChatApi } from '@rinciku/domain/ai-chat';
import { supabase } from '@/lib/supabase';
import { createAttachment, uploadAttachment } from '@/features/expenses/api';
import {
  createIncomeAttachment,
  uploadIncomeAttachment,
} from '@/features/incomes/api';
import type { PendingAttachment, ProposalKind } from './types';

// The ai-chat brain is portable and lives in @rinciku/domain/ai-chat (shared by
// web + mobile). This file binds the factory to the web Supabase client and
// re-exports the result, plus the browser-only image helpers (File/FileReader)
// that can't live in the portable layer.
const api = createAiChatApi(supabase);

export const {
  listConversations,
  createConversation,
  getMessages,
  chatImageUrl,
  chatImageUrls,
  appendMessage,
  touchConversation,
  deleteConversation,
  getConversationSummary,
  maybeSummarizeConversation,
  buildBudgetContext,
  sendChat,
  executeReadTool,
  applyProposedChange,
  resolveChangeTarget,
  runAgentTurn,
  confirmExpenseProposal,
  confirmIncomeProposal,
} = api;

// Pure helpers + types re-exported straight from the domain slice.
export {
  extractText,
  parseProposal,
  summarizeProposal,
  conversationTitleFrom,
} from '@rinciku/domain/ai-chat';
export {
  CONVERSATIONS_PAGE_SIZE,
  MESSAGES_PAGE_SIZE,
} from '@rinciku/domain/ai-chat';
export type {
  AppendMessageInput,
  ConfirmAttachment,
  ConfirmBase,
  ChatMessageRowWithImage,
  ConversationsPage,
  MessageCursor,
  MessagesPage,
} from '@rinciku/domain/ai-chat';

type Result<T> = {
  data: T | null;
  error: PostgrestError | Error | null;
};

// --- Image extraction (browser-only: File / FileReader) --------------------

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

// Stores a chat image up front — before the model decides expense vs income —
// so the sent message can render it immediately and reload it later. Lives in
// the expense-attachments bucket because messages.attachment_id references
// expense_attachments; it stays unconfirmed (no expense_id) and is independent
// of any transaction attachment created later when a proposal is confirmed.
export async function uploadChatImage(
  file: File,
  userId: string
): Promise<Result<{ attachmentId: string; storagePath: string }>> {
  const up = await uploadAttachment(file, { userId, occurredAt: new Date() });
  if (up.error || !up.data) return { data: null, error: up.error };
  const row = await createAttachment({
    user_id: userId,
    storage_path: up.data.storage_path,
    mime_type: file.type,
    file_size_bytes: file.size,
  });
  if (row.error || !row.data) return { data: null, error: row.error };
  return {
    data: { attachmentId: row.data.id, storagePath: up.data.storage_path },
    error: null,
  };
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
