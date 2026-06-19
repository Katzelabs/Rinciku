import type { PostgrestError } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

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

export async function listCategories(): Promise<
  Result<Tables<'categories'>[]>
> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  return { data, error };
}

export async function createCategory(
  input: CreateCategoryInput
): Promise<Result<Tables<'categories'>>> {
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select('*')
    .single();
  return { data, error };
}

export async function updateCategory(
  id: string,
  patch: UpdateCategoryPatch
): Promise<Result<Tables<'categories'>>> {
  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  return { data, error };
}

export async function deleteCategory(id: string): Promise<Result<null>> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return { data: null, error };
}

// --- tiers -----------------------------------------------------------------

type TierFields = Pick<Tables<'tiers'>, 'name' | 'color' | 'is_essential'>;

export type CreateTierInput = TierFields & {
  user_id: string;
  sort_order?: number;
};
export type UpdateTierPatch = Partial<TierFields>;

export async function listTiers(): Promise<Result<Tables<'tiers'>[]>> {
  const { data, error } = await supabase
    .from('tiers')
    .select('*')
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  return { data, error };
}

export async function createTier(
  input: CreateTierInput
): Promise<Result<Tables<'tiers'>>> {
  const { data, error } = await supabase
    .from('tiers')
    .insert(input)
    .select('*')
    .single();
  return { data, error };
}

export async function updateTier(
  id: string,
  patch: UpdateTierPatch
): Promise<Result<Tables<'tiers'>>> {
  const { data, error } = await supabase
    .from('tiers')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  return { data, error };
}

export async function deleteTier(id: string): Promise<Result<null>> {
  const { error } = await supabase.from('tiers').delete().eq('id', id);
  return { data: null, error };
}
