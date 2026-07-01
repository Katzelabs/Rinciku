import type { PostgrestError } from '@supabase/supabase-js';
import type { Database, Tables, TypedSupabaseClient } from '@rinciku/db';
import type { CurrencyCode } from '@rinciku/core';

// Portable incomes data layer, shared by web + mobile. The Supabase client is
// injected so the same code runs against the browser client and the native
// client. Receipt attachments, CSV bulk import, and signed-URL previews stay in
// the web-local api.ts for now (they lean on `File`/`crypto` + Storage); this
// factory covers the CRUD surface both platforms need.

type IncomeRow = Database['public']['Tables']['incomes']['Row'];
type IncomeUpdate = Database['public']['Tables']['incomes']['Update'];
type IncomeCategoryRow =
  Database['public']['Tables']['income_categories']['Row'];
type AttachmentRow = Database['public']['Tables']['income_attachments']['Row'];

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

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type PaginatedResult<T> = {
  data: T[] | null;
  count: number | null;
  error: PostgrestError | null;
};

const INCOME_WITH_RELATIONS_SELECT =
  '*, category:income_categories!incomes_source_id_fkey(*), attachment:income_attachments!incomes_attachment_id_fkey(*)';

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
  };
}

export type IncomesApi = ReturnType<typeof createIncomesApi>;
