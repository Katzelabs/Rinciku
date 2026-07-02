import type { PostgrestError } from '@supabase/supabase-js';
import type { Database, Tables, TypedSupabaseClient } from '@rinciku/db';
import type { CurrencyCode } from '@rinciku/core';

// Portable incomes data layer, shared by web + mobile. The Supabase client is
// injected so the same code runs against the browser client and the native
// client. CSV bulk import stays web-local; receipt attachments live here (they
// mirror the expenses factory) so the shared ai-chat slice can confirm an
// image-sourced income on both platforms.

type IncomeRow = Database['public']['Tables']['incomes']['Row'];
type IncomeUpdate = Database['public']['Tables']['incomes']['Update'];
type IncomeCategoryRow =
  Database['public']['Tables']['income_categories']['Row'];
type AttachmentRow = Database['public']['Tables']['income_attachments']['Row'];
type AttachmentUpdate =
  Database['public']['Tables']['income_attachments']['Update'];

export type IncomeWithRelations = IncomeRow & {
  // `source_id` joined relation. Named `category` (not `source`) to avoid
  // colliding with the existing `source` provenance text column.
  category: IncomeCategoryRow | null;
  attachment: AttachmentRow | null;
};

export type ListIncomesParams = {
  from: string;
  to: string;
  categoryIds?: string[];
  search?: string;
  limit: number;
  offset: number;
};

export type SumIncomesParams = {
  from: string;
  to: string;
  categoryIds?: string[];
  search?: string;
};

export type IncomeAmountRow = Pick<IncomeRow, 'amount' | 'currency'>;

export type CreateIncomeInput = {
  user_id: string;
  source_id?: string | null;
  amount: number;
  currency: CurrencyCode;
  occurred_at: string;
  note: string | null;
  source: 'manual' | 'chat' | 'image';
  attachment_id?: string | null;
};

// --- income categories (flat taxonomy, no tier — mirrors categories/api.ts) ---

type IncomeCategoryFields = Pick<
  Tables<'income_categories'>,
  'name' | 'icon' | 'color'
>;

export type CreateIncomeCategoryInput = IncomeCategoryFields & {
  user_id: string;
  sort_order?: number;
};
export type UpdateIncomeCategoryPatch = Partial<IncomeCategoryFields>;

// --- income attachments (mirrors expenses/api.ts) --------------------------

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

type PaginatedResult<T> = {
  data: T[] | null;
  count: number | null;
  error: PostgrestError | null;
};

type StorageResult<T> = {
  data: T | null;
  error: Error | null;
};

const INCOME_WITH_RELATIONS_SELECT =
  '*, category:income_categories!incomes_source_id_fkey(*), attachment:income_attachments!incomes_attachment_id_fkey(*)';

const ATTACHMENTS_BUCKET = 'income-attachments';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

const KNOWN_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf']);

function resolveExtension(file: File): string {
  const nameExt = file.name.split('.').pop()?.toLowerCase();
  if (nameExt && KNOWN_EXTS.has(nameExt)) {
    return nameExt === 'jpeg' ? 'jpg' : nameExt;
  }
  return MIME_TO_EXT[file.type] ?? 'bin';
}

/**
 * Incomes + income-source data layer. The Supabase client is injected so the
 * same code runs against the web browser client and the native client.
 */
export function createIncomesApi(db: TypedSupabaseClient) {
  async function listIncomes({
    from,
    to,
    categoryIds,
    search,
    limit,
    offset,
  }: ListIncomesParams): Promise<PaginatedResult<IncomeWithRelations>> {
    let query = db
      .from('incomes')
      .select(INCOME_WITH_RELATIONS_SELECT, { count: 'exact' })
      .gte('occurred_at', from)
      .lte('occurred_at', to)
      .order('occurred_at', { ascending: false });

    if (categoryIds && categoryIds.length > 0) {
      query = query.in('source_id', categoryIds);
    }
    if (search && search.trim()) {
      query = query.ilike('note', `%${search.trim()}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .returns<IncomeWithRelations[]>();
    return { data, count, error };
  }

  // Lightweight aggregate for the footer total: same filters as listIncomes but
  // every matching row (no paging), summed + converted client-side so the total
  // stays accurate across all pages of the filtered set.
  async function sumIncomes({
    from,
    to,
    categoryIds,
    search,
  }: SumIncomesParams): Promise<Result<IncomeAmountRow[]>> {
    let query = db
      .from('incomes')
      .select('amount, currency')
      .gte('occurred_at', from)
      .lte('occurred_at', to);

    if (categoryIds && categoryIds.length > 0) {
      query = query.in('source_id', categoryIds);
    }
    if (search && search.trim()) {
      query = query.ilike('note', `%${search.trim()}%`);
    }

    const { data, error } = await query.returns<IncomeAmountRow[]>();
    return { data, error };
  }

  async function getIncome(id: string): Promise<Result<IncomeWithRelations>> {
    const { data, error } = await db
      .from('incomes')
      .select(INCOME_WITH_RELATIONS_SELECT)
      .eq('id', id)
      .returns<IncomeWithRelations[]>()
      .maybeSingle();
    return { data, error };
  }

  async function createIncome(
    input: CreateIncomeInput
  ): Promise<Result<IncomeRow>> {
    const { data, error } = await db
      .from('incomes')
      .insert(input)
      .select('*')
      .single();
    return { data, error };
  }

  async function updateIncome(
    id: string,
    patch: IncomeUpdate
  ): Promise<Result<IncomeRow>> {
    const { data, error } = await db
      .from('incomes')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    return { data, error };
  }

  async function deleteIncome(id: string): Promise<Result<null>> {
    const { error } = await db.from('incomes').delete().eq('id', id);
    return { data: null, error };
  }

  async function listIncomeCategories(): Promise<
    Result<Tables<'income_categories'>[]>
  > {
    const { data, error } = await db
      .from('income_categories')
      .select('*')
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    return { data, error };
  }

  async function createIncomeCategory(
    input: CreateIncomeCategoryInput
  ): Promise<Result<Tables<'income_categories'>>> {
    const { data, error } = await db
      .from('income_categories')
      .insert(input)
      .select('*')
      .single();
    return { data, error };
  }

  async function updateIncomeCategory(
    id: string,
    patch: UpdateIncomeCategoryPatch
  ): Promise<Result<Tables<'income_categories'>>> {
    const { data, error } = await db
      .from('income_categories')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    return { data, error };
  }

  async function deleteIncomeCategory(id: string): Promise<Result<null>> {
    const { error } = await db.from('income_categories').delete().eq('id', id);
    return { data: null, error };
  }

  // --- income attachments --------------------------------------------------

  async function uploadIncomeAttachment(
    file: File,
    { userId, occurredAt }: UploadIncomeAttachmentOptions
  ): Promise<StorageResult<{ storage_path: string }>> {
    const year = occurredAt.getFullYear();
    const month = String(occurredAt.getMonth() + 1).padStart(2, '0');
    const ext = resolveExtension(file);
    const storage_path = `${userId}/${year}-${month}/${crypto.randomUUID()}.${ext}`;

    const { error } = await db.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(storage_path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) return { data: null, error };
    return { data: { storage_path }, error: null };
  }

  async function createIncomeAttachment(
    input: CreateIncomeAttachmentInput
  ): Promise<Result<AttachmentRow>> {
    // The ai-chat slice UPDATEs ai_raw_extraction + ai_confidence + doc_type
    // when a proposal is confirmed; here we just record the file.
    const { data, error } = await db
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

  async function updateIncomeAttachment(
    id: string,
    patch: AttachmentUpdate
  ): Promise<Result<AttachmentRow>> {
    const { data, error } = await db
      .from('income_attachments')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    return { data, error };
  }

  async function getIncomeAttachmentSignedUrl(
    storage_path: string,
    expiresIn = 60
  ): Promise<StorageResult<{ signedUrl: string }>> {
    const { data, error } = await db.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrl(storage_path, expiresIn);
    if (error) return { data: null, error };
    return { data: { signedUrl: data.signedUrl }, error: null };
  }

  async function deleteIncomeAttachment(id: string): Promise<Result<null>> {
    const { error } = await db
      .from('income_attachments')
      .delete()
      .eq('id', id);
    return { data: null, error };
  }

  async function deleteIncomeAttachmentObject(storage_path: string) {
    return db.storage.from(ATTACHMENTS_BUCKET).remove([storage_path]);
  }

  return {
    listIncomes,
    sumIncomes,
    getIncome,
    createIncome,
    updateIncome,
    deleteIncome,
    listIncomeCategories,
    createIncomeCategory,
    updateIncomeCategory,
    deleteIncomeCategory,
    uploadIncomeAttachment,
    createIncomeAttachment,
    updateIncomeAttachment,
    getIncomeAttachmentSignedUrl,
    deleteIncomeAttachment,
    deleteIncomeAttachmentObject,
  };
}

export type IncomesApi = ReturnType<typeof createIncomesApi>;
