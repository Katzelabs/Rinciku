import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { CurrencyCode } from '@/lib/fx';
import { supabase } from '@/lib/supabase';

type EssentialRow = Database['public']['Tables']['essentials']['Row'];
type EssentialUpdate = Database['public']['Tables']['essentials']['Update'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type TierRow = Database['public']['Tables']['tiers']['Row'];

export type CategoryWithTier = CategoryRow & { tier: TierRow | null };

export type EssentialWithCategory = EssentialRow & {
  category: CategoryWithTier | null;
};

export type CreateEssentialInput = {
  user_id: string;
  name: string;
  estimated_amount: number;
  currency: CurrencyCode;
  category_id: string | null;
  is_active?: boolean;
};

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

const ESSENTIAL_WITH_CATEGORY_SELECT =
  '*, category:categories(*, tier:tiers(*))';

export async function listEssentials(): Promise<
  Result<EssentialWithCategory[]>
> {
  const { data, error } = await supabase
    .from('essentials')
    .select(ESSENTIAL_WITH_CATEGORY_SELECT)
    .order('created_at', { ascending: false })
    .returns<EssentialWithCategory[]>();
  return { data, error };
}

export async function createEssential(
  input: CreateEssentialInput
): Promise<Result<EssentialRow>> {
  const { data, error } = await supabase
    .from('essentials')
    .insert(input)
    .select('*')
    .single();
  return { data, error };
}

export async function updateEssential(
  id: string,
  patch: EssentialUpdate
): Promise<Result<EssentialRow>> {
  const { data, error } = await supabase
    .from('essentials')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  return { data, error };
}

export async function deleteEssential(id: string): Promise<Result<null>> {
  const { error } = await supabase.from('essentials').delete().eq('id', id);
  return { data: null, error };
}
