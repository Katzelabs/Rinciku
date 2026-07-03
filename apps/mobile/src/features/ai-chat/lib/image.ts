import { createExpensesApi } from '@rinciku/domain/expenses';
import { createIncomesApi } from '@rinciku/domain/incomes';

import { supabase } from '@/lib/supabase';
import {
  EXPENSE_BUCKET,
  INCOME_BUCKET,
  uploadAttachmentObject,
  type PickedImage,
} from '@/lib/attachments';
import type { PendingAttachment, ProposalKind } from '../types';

// Chat-specific attachment orchestration. The generic native picker + upload
// live in @/lib/attachments (shared with the manual expense/income forms); here
// we only add the ai-chat flow on top, reusing the portable domain DB inserts
// (createAttachment / createIncomeAttachment).
const { createAttachment } = createExpensesApi(supabase);
const { createIncomeAttachment } = createIncomesApi(supabase);

// Re-exported for the composer, which imports the picker from this module.
export {
  pickImage,
  type PickedImage,
  type PickOutcome,
  type PickSource,
} from '@/lib/attachments';

type Result<T> = { data: T | null; error: Error | null };

// Stores the chat image up front — before the model decides expense vs income —
// so the sent message can render it immediately and reload it later. Lives in
// the expense-attachments bucket because messages.attachment_id references
// expense_attachments; it stays unconfirmed (no expense_id).
export async function uploadChatImage(
  asset: PickedImage,
  userId: string
): Promise<Result<{ attachmentId: string; storagePath: string }>> {
  const up = await uploadAttachmentObject(EXPENSE_BUCKET, asset, userId);
  if (up.error || !up.data) return { data: null, error: up.error };
  const row = await createAttachment({
    user_id: userId,
    storage_path: up.data.storage_path,
    mime_type: asset.mimeType,
    file_size_bytes: asset.fileSize,
  });
  if (row.error || !row.data) return { data: null, error: row.error };
  return {
    data: { attachmentId: row.data.id, storagePath: up.data.storage_path },
    error: null,
  };
}

// Uploads to the bucket matching the resolved kind and records the attachment
// row. Called after extraction so we know whether it's an expense or income
// document (the two live in separate tables/buckets), and the confirm step can
// link it to the created record.
export async function createImageAttachment(
  asset: PickedImage,
  kind: ProposalKind,
  userId: string
): Promise<Result<PendingAttachment>> {
  if (kind === 'expense') {
    const up = await uploadAttachmentObject(EXPENSE_BUCKET, asset, userId);
    if (up.error || !up.data) return { data: null, error: up.error };
    const row = await createAttachment({
      user_id: userId,
      storage_path: up.data.storage_path,
      mime_type: asset.mimeType,
      file_size_bytes: asset.fileSize,
    });
    if (row.error || !row.data) return { data: null, error: row.error };
    return { data: { id: row.data.id, kind }, error: null };
  }
  const up = await uploadAttachmentObject(INCOME_BUCKET, asset, userId);
  if (up.error || !up.data) return { data: null, error: up.error };
  const row = await createIncomeAttachment({
    user_id: userId,
    storage_path: up.data.storage_path,
    mime_type: asset.mimeType,
    file_size_bytes: asset.fileSize,
  });
  if (row.error || !row.data) return { data: null, error: row.error };
  return { data: { id: row.data.id, kind }, error: null };
}
