import type { PostgrestError } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

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
