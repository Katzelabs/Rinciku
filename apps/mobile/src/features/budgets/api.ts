import { createBudgetsApi } from '@rinciku/domain/budgets';

import { supabase } from '@/lib/supabase';

// Shared data layer (@rinciku/domain) bound to the mobile Supabase client — the
// same shim pattern as features/categories/api.ts. Don't write supabase.from(...)
// calls here; the query/mutation logic lives in the domain factory.
const api = createBudgetsApi(supabase);

export const {
  listBudgets,
  upsertBudget,
  deleteBudget,
  listTierBudgets,
  upsertTierBudget,
  deleteTierBudget,
  getBudgetActuals,
  copyFromPreviousPeriod,
} = api;

export type { BudgetsApi } from '@rinciku/domain/budgets';
