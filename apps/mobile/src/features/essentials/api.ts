import { createEssentialsApi } from '@rinciku/domain/essentials';

import { supabase } from '@/lib/supabase';

// Shared data layer (@rinciku/domain) bound to the mobile Supabase client — the
// same shim pattern as features/auth/api.ts. Don't write supabase.from(...)
// calls here; the query/mutation logic lives in the domain factory.
const api = createEssentialsApi(supabase);

export const {
  listEssentials,
  createEssential,
  updateEssential,
  deleteEssential,
} = api;

export type { EssentialsApi } from '@rinciku/domain/essentials';
