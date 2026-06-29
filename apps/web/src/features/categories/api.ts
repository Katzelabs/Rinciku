import { createCategoriesApi } from '@rinciku/domain/categories';
import { supabase } from '@/lib/supabase';

// Data layer lives in @rinciku/domain (shared with mobile); this thin shim binds
// it to the web Supabase client and re-exports the named functions + input types
// so existing call sites (`import { listCategories } from '../api'`) keep working.
export type {
  CreateCategoryInput,
  UpdateCategoryPatch,
  CreateTierInput,
  UpdateTierPatch,
  CategoriesApi,
} from '@rinciku/domain/categories';

const api = createCategoriesApi(supabase);

export const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listTiers,
  createTier,
  updateTier,
  deleteTier,
} = api;
