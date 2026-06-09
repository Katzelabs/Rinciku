import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { CurrencyCode } from '@/lib/fx';
import { supabase } from '@/lib/supabase';

// Image-logging flow is split across two slices (parallel to expenses/api.ts):
//   - this file: upload + storage row + signed-URL preview + confirm link to income.
//   - features/ai-chat (future): after createIncomeAttachment, an Edge Function runs
//     Claude Vision and then calls updateIncomeAttachment({ ai_raw_extraction,
//     ai_confidence, doc_type }). The user reviews the extracted fields in chat,
//     and confirming into an income reuses createIncome + updateIncomeAttachment
//     from here.

type IncomeRow = Database['public']['Tables']['incomes']['Row'];
type IncomeUpdate = Database['public']['Tables']['incomes']['Update'];
type AttachmentRow = Database['public']['Tables']['income_attachments']['Row'];
type AttachmentUpdate =
  Database['public']['Tables']['income_attachments']['Update'];

export type IncomeWithRelations = IncomeRow & {
  attachment: AttachmentRow | null;
};

export type ListIncomesParams = {
  from: string;
  to: string;
};

export type CreateIncomeInput = {
  user_id: string;
  amount: number;
  currency: CurrencyCode;
  occurred_at: string;
  note: string | null;
  source: 'manual' | 'chat' | 'image';
  attachment_id?: string | null;
};

export type CreateIncomeAttachmentInput = {
  user_id: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
};

export type UploadIncomeAttachmentOptions = {
  userId: string;
  occurredAt: Date;
};

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type StorageResult<T> = {
  data: T | null;
  error: Error | null;
};

const ATTACHMENTS_BUCKET = 'income-attachments';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

const KNOWN_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf']);

const INCOME_WITH_RELATIONS_SELECT =
  '*, attachment:income_attachments!incomes_attachment_id_fkey(*)';

export async function listIncomes({
  from,
  to,
}: ListIncomesParams): Promise<Result<IncomeWithRelations[]>> {
  const { data, error } = await supabase
    .from('incomes')
    .select(INCOME_WITH_RELATIONS_SELECT)
    .gte('occurred_at', from)
    .lte('occurred_at', to)
    .order('occurred_at', { ascending: false })
    .returns<IncomeWithRelations[]>();
  return { data, error };
}

export async function getIncome(
  id: string
): Promise<Result<IncomeWithRelations>> {
  const { data, error } = await supabase
    .from('incomes')
    .select(INCOME_WITH_RELATIONS_SELECT)
    .eq('id', id)
    .returns<IncomeWithRelations[]>()
    .maybeSingle();
  return { data, error };
}

export async function createIncome(
  input: CreateIncomeInput
): Promise<Result<IncomeRow>> {
  const { data, error } = await supabase
    .from('incomes')
    .insert(input)
    .select('*')
    .single();
  return { data, error };
}

export async function updateIncome(
  id: string,
  patch: IncomeUpdate
): Promise<Result<IncomeRow>> {
  const { data, error } = await supabase
    .from('incomes')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  return { data, error };
}

export async function deleteIncome(id: string): Promise<Result<null>> {
  const { error } = await supabase.from('incomes').delete().eq('id', id);
  return { data: null, error };
}

export async function uploadIncomeAttachment(
  file: File,
  { userId, occurredAt }: UploadIncomeAttachmentOptions
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

export async function createIncomeAttachment(
  input: CreateIncomeAttachmentInput
): Promise<Result<AttachmentRow>> {
  // ai-chat slice will UPDATE ai_raw_extraction + ai_confidence + doc_type
  // after Claude Vision runs; here we just record the file.
  const { data, error } = await supabase
    .from('income_attachments')
    .insert({
      user_id: input.user_id,
      storage_path: input.storage_path,
      mime_type: input.mime_type,
      file_size_bytes: input.file_size_bytes,
      doc_type: 'unknown',
      confirmed: false,
      income_id: null,
      ai_raw_extraction: null,
    })
    .select('*')
    .single();
  return { data, error };
}

export async function updateIncomeAttachment(
  id: string,
  patch: AttachmentUpdate
): Promise<Result<AttachmentRow>> {
  const { data, error } = await supabase
    .from('income_attachments')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  return { data, error };
}

export async function getIncomeAttachmentSignedUrl(
  storage_path: string,
  expiresIn = 60
): Promise<StorageResult<{ signedUrl: string }>> {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storage_path, expiresIn);
  if (error) return { data: null, error };
  return { data: { signedUrl: data.signedUrl }, error: null };
}

export async function deleteIncomeAttachment(id: string): Promise<Result<null>> {
  const { error } = await supabase
    .from('income_attachments')
    .delete()
    .eq('id', id);
  return { data: null, error };
}

export async function deleteIncomeAttachmentObject(storage_path: string) {
  return supabase.storage.from(ATTACHMENTS_BUCKET).remove([storage_path]);
}

function resolveExtension(file: File): string {
  const nameExt = file.name.split('.').pop()?.toLowerCase();
  if (nameExt && KNOWN_EXTS.has(nameExt)) {
    return nameExt === 'jpeg' ? 'jpg' : nameExt;
  }
  return MIME_TO_EXT[file.type] ?? 'bin';
}
