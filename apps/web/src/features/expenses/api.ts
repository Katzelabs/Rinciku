import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@rinciku/db';
import type { CurrencyCode } from '@rinciku/core';
import { supabase } from '@/lib/supabase';

// Image-logging flow is split across two slices:
//   - this file: upload + storage row + signed-URL preview + confirm link to expense.
//   - features/ai-chat (future): after createAttachment, an Edge Function runs Claude
//     Vision and then calls updateAttachment({ ai_raw_extraction, ai_confidence,
//     doc_type }). The user reviews the extracted fields in chat, and confirming
//     into an expense reuses createExpense + updateAttachment from here.

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type TierRow = Database['public']['Tables']['tiers']['Row'];
type AttachmentRow = Database['public']['Tables']['expense_attachments']['Row'];
type AttachmentUpdate =
  Database['public']['Tables']['expense_attachments']['Update'];

export type CategoryWithTier = CategoryRow & { tier: TierRow | null };

export type ExpenseWithRelations = ExpenseRow & {
  category: CategoryWithTier | null;
  attachment: AttachmentRow | null;
};

export type ListExpensesParams = {
  from: string;
  to: string;
  categoryIds?: string[];
  search?: string;
  limit: number;
  offset: number;
};

export type SumExpensesParams = {
  from: string;
  to: string;
  categoryIds?: string[];
  search?: string;
};

export type ExpenseAmountRow = Pick<ExpenseRow, 'amount' | 'currency'>;

export type CreateExpenseInput = {
  user_id: string;
  amount: number;
  currency: CurrencyCode;
  category_id: string | null;
  occurred_at: string;
  note: string | null;
  source: 'manual' | 'chat' | 'image';
  attachment_id?: string | null;
};

export type CreateAttachmentInput = {
  user_id: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
};

export type UploadAttachmentOptions = {
  userId: string;
  occurredAt: Date;
};

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type PaginatedResult<T> = {
  data: T[] | null;
  count: number | null;
  error: PostgrestError | null;
};

type StorageResult<T> = {
  data: T | null;
  error: Error | null;
};

const ATTACHMENTS_BUCKET = 'expense-attachments';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

const KNOWN_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf']);

const EXPENSE_WITH_RELATIONS_SELECT =
  '*, category:categories(*, tier:tiers(*)), attachment:expense_attachments!expenses_attachment_id_fkey(*)';

export async function listExpenses({
  from,
  to,
  categoryIds,
  search,
  limit,
  offset,
}: ListExpensesParams): Promise<PaginatedResult<ExpenseWithRelations>> {
  let query = supabase
    .from('expenses')
    .select(EXPENSE_WITH_RELATIONS_SELECT, { count: 'exact' })
    .gte('occurred_at', from)
    .lte('occurred_at', to)
    .order('occurred_at', { ascending: false });

  if (categoryIds && categoryIds.length > 0) {
    query = query.in('category_id', categoryIds);
  }
  if (search && search.trim()) {
    query = query.ilike('note', `%${search.trim()}%`);
  }

  const { data, error, count } = await query
    .range(offset, offset + limit - 1)
    .returns<ExpenseWithRelations[]>();
  return { data, count, error };
}

// Lightweight aggregate for the footer total: same filters as listExpenses but
// every matching row (no paging) and only the columns needed to convert + sum
// client-side. Keeps the total accurate across all pages of the filtered set.
export async function sumExpenses({
  from,
  to,
  categoryIds,
  search,
}: SumExpensesParams): Promise<Result<ExpenseAmountRow[]>> {
  let query = supabase
    .from('expenses')
    .select('amount, currency')
    .gte('occurred_at', from)
    .lte('occurred_at', to);

  if (categoryIds && categoryIds.length > 0) {
    query = query.in('category_id', categoryIds);
  }
  if (search && search.trim()) {
    query = query.ilike('note', `%${search.trim()}%`);
  }

  const { data, error } = await query.returns<ExpenseAmountRow[]>();
  return { data, error };
}

export async function getExpense(
  id: string
): Promise<Result<ExpenseWithRelations>> {
  const { data, error } = await supabase
    .from('expenses')
    .select(EXPENSE_WITH_RELATIONS_SELECT)
    .eq('id', id)
    .returns<ExpenseWithRelations[]>()
    .maybeSingle();
  return { data, error };
}

export async function createExpense(
  input: CreateExpenseInput
): Promise<Result<ExpenseRow>> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(input)
    .select('*')
    .single();
  return { data, error };
}

// Bulk insert for CSV import: one request inserts the whole batch in a single
// statement, so it succeeds or fails atomically. Callers pre-validate rows
// (amount/currency/date) so the realistic failure modes are RLS or a bad
// category_id — both surfaced via the returned PostgrestError.
export async function bulkCreateExpenses(
  inputs: CreateExpenseInput[]
): Promise<Result<ExpenseRow[]>> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(inputs)
    .select('*');
  return { data, error };
}

export async function updateExpense(
  id: string,
  patch: ExpenseUpdate
): Promise<Result<ExpenseRow>> {
  const { data, error } = await supabase
    .from('expenses')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  return { data, error };
}

export async function deleteExpense(id: string): Promise<Result<null>> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  return { data: null, error };
}

export async function uploadAttachment(
  file: File,
  { userId, occurredAt }: UploadAttachmentOptions
): Promise<StorageResult<{ storage_path: string }>> {
  const year = occurredAt.getFullYear();
  const month = String(occurredAt.getMonth() + 1).padStart(2, '0');
  const ext = resolveExtension(file);
  const storage_path = `${userId}/${year}-${month}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(storage_path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) return { data: null, error };
  return { data: { storage_path }, error: null };
}

export async function createAttachment(
  input: CreateAttachmentInput
): Promise<Result<AttachmentRow>> {
  // ai-chat slice will UPDATE ai_raw_extraction + ai_confidence + doc_type
  // after Claude Vision runs; here we just record the file.
  const { data, error } = await supabase
    .from('expense_attachments')
    .insert({
      user_id: input.user_id,
      storage_path: input.storage_path,
      mime_type: input.mime_type,
      file_size_bytes: input.file_size_bytes,
      doc_type: 'unknown',
      confirmed: false,
      expense_id: null,
      ai_raw_extraction: null,
    })
    .select('*')
    .single();
  return { data, error };
}

export async function updateAttachment(
  id: string,
  patch: AttachmentUpdate
): Promise<Result<AttachmentRow>> {
  const { data, error } = await supabase
    .from('expense_attachments')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  return { data, error };
}

export async function getAttachmentSignedUrl(
  storage_path: string,
  expiresIn = 60
): Promise<StorageResult<{ signedUrl: string }>> {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storage_path, expiresIn);
  if (error) return { data: null, error };
  return { data: { signedUrl: data.signedUrl }, error: null };
}

export async function deleteAttachment(id: string): Promise<Result<null>> {
  const { error } = await supabase
    .from('expense_attachments')
    .delete()
    .eq('id', id);
  return { data: null, error };
}

export async function deleteAttachmentObject(storage_path: string) {
  return supabase.storage.from(ATTACHMENTS_BUCKET).remove([storage_path]);
}

function resolveExtension(file: File): string {
  const nameExt = file.name.split('.').pop()?.toLowerCase();
  if (nameExt && KNOWN_EXTS.has(nameExt)) {
    return nameExt === 'jpeg' ? 'jpg' : nameExt;
  }
  return MIME_TO_EXT[file.type] ?? 'bin';
}
