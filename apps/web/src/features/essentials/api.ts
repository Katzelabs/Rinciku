import { createEssentialsApi } from '@rinciku/domain/essentials';
import { supabase } from '@/lib/supabase';

// Data layer lives in @rinciku/domain (shared with mobile); this thin shim binds
// it to the web Supabase client and re-exports the named functions + types so
// existing call sites (`import { listEssentials } from '../api'`) keep working.
export type {
  CategoryWithTier,
  EssentialWithCategory,
  EssentialRow,
  EssentialUpdate,
  CreateEssentialInput,
  EssentialsApi,
} from '@rinciku/domain/essentials';

const api = createEssentialsApi(supabase);

export const {
  listEssentials,
  createEssential,
  updateEssential,
  deleteEssential,
} = api;
