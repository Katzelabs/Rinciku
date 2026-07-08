import type { PostgrestError } from '@supabase/supabase-js';
import type { TypedSupabaseClient } from '@rinciku/db';

import type {
  CreateEssentialInput,
  EssentialRow,
  EssentialUpdate,
  EssentialWithCategory,
} from './types';

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

const ESSENTIAL_WITH_CATEGORY_SELECT =
  '*, category:categories(*, tier:tiers(*))';

/**
 * Essentials data layer. The Supabase client is injected so the same code runs
 * against the web browser client and the native client.
 */
export function createEssentialsApi(db: TypedSupabaseClient) {
  async function listEssentials(): Promise<Result<EssentialWithCategory[]>> {
    const { data, error } = await db
      .from('essentials')
      .select(ESSENTIAL_WITH_CATEGORY_SELECT)
      .order('created_at', { ascending: false })
      .returns<EssentialWithCategory[]>();
    return { data, error };
  }

  async function getEssential(
    id: string
  ): Promise<Result<EssentialWithCategory>> {
    const { data, error } = await db
      .from('essentials')
      .select(ESSENTIAL_WITH_CATEGORY_SELECT)
      .eq('id', id)
      .returns<EssentialWithCategory[]>()
      .maybeSingle();
    return { data, error };
  }

  async function createEssential(
    input: CreateEssentialInput
  ): Promise<Result<EssentialRow>> {
    const { data, error } = await db
      .from('essentials')
      .insert(input)
      .select('*')
      .single();
    return { data, error };
  }

  async function updateEssential(
    id: string,
    patch: EssentialUpdate
  ): Promise<Result<EssentialRow>> {
    const { data, error } = await db
      .from('essentials')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    return { data, error };
  }

  async function deleteEssential(id: string): Promise<Result<null>> {
    const { error } = await db.from('essentials').delete().eq('id', id);
    return { data: null, error };
  }

  return {
    listEssentials,
    getEssential,
    createEssential,
    updateEssential,
    deleteEssential,
  };
}

export type EssentialsApi = ReturnType<typeof createEssentialsApi>;
