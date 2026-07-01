import { createCategoriesApi } from '@rinciku/domain/categories';

import { supabase } from '@/lib/supabase';

// Shared data layer (@rinciku/domain) bound to the mobile Supabase client — the
// same shim pattern as features/auth/api.ts. Don't write supabase.from(...)
// calls here; the query/mutation logic lives in the domain factory.
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

export type { CategoriesApi } from '@rinciku/domain/categories';
