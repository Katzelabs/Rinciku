import type { PostgrestError } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type CategoryFields = Pick<Tables<'categories'>, 'name' | 'tier' | 'icon' | 'color'>;

export type CreateCategoryInput = CategoryFields & { user_id: string };
export type UpdateCategoryPatch = Partial<CategoryFields>;

export async function listCategories(): Promise<Result<Tables<'categories'>[]>> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_archived', false)
    .order('tier', { ascending: true })
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
