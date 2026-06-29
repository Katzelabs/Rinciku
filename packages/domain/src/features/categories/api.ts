import type { PostgrestError } from '@supabase/supabase-js';
import type { Tables, TypedSupabaseClient } from '@rinciku/db';

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type CategoryFields = Pick<
  Tables<'categories'>,
  'name' | 'tier_id' | 'icon' | 'color'
>;

export type CreateCategoryInput = CategoryFields & { user_id: string };
export type UpdateCategoryPatch = Partial<CategoryFields>;

type TierFields = Pick<Tables<'tiers'>, 'name' | 'color' | 'is_essential'>;

export type CreateTierInput = TierFields & {
  user_id: string;
  sort_order?: number;
};
export type UpdateTierPatch = Partial<TierFields>;

/**
 * Categories + tiers data layer. The Supabase client is injected so the same
 * code runs against the web browser client and the native client.
 */
export function createCategoriesApi(db: TypedSupabaseClient) {
  async function listCategories(): Promise<Result<Tables<'categories'>[]>> {
    const { data, error } = await db
      .from('categories')
      .select('*')
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    return { data, error };
  }

  async function createCategory(
    input: CreateCategoryInput
  ): Promise<Result<Tables<'categories'>>> {
    const { data, error } = await db
      .from('categories')
      .insert(input)
      .select('*')
      .single();
    return { data, error };
  }

  async function updateCategory(
    id: string,
    patch: UpdateCategoryPatch
  ): Promise<Result<Tables<'categories'>>> {
    const { data, error } = await db
      .from('categories')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    return { data, error };
  }

  async function deleteCategory(id: string): Promise<Result<null>> {
    const { error } = await db.from('categories').delete().eq('id', id);
    return { data: null, error };
  }

  // --- tiers ---------------------------------------------------------------

  async function listTiers(): Promise<Result<Tables<'tiers'>[]>> {
    const { data, error } = await db
      .from('tiers')
      .select('*')
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    return { data, error };
  }

  async function createTier(
    input: CreateTierInput
  ): Promise<Result<Tables<'tiers'>>> {
    const { data, error } = await db
      .from('tiers')
      .insert(input)
      .select('*')
      .single();
    return { data, error };
  }

  async function updateTier(
    id: string,
    patch: UpdateTierPatch
  ): Promise<Result<Tables<'tiers'>>> {
    const { data, error } = await db
      .from('tiers')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    return { data, error };
  }

  async function deleteTier(id: string): Promise<Result<null>> {
    const { error } = await db.from('tiers').delete().eq('id', id);
    return { data: null, error };
  }

  return {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    listTiers,
    createTier,
    updateTier,
    deleteTier,
  };
}

export type CategoriesApi = ReturnType<typeof createCategoriesApi>;
