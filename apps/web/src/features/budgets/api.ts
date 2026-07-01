import { createBudgetsApi } from '@rinciku/domain/budgets';
import { supabase } from '@/lib/supabase';

// Data layer lives in @rinciku/domain (shared with mobile); this thin shim binds
// it to the web Supabase client and re-exports the named functions + input types
// so existing call sites (`import { listBudgets } from '../api'`) keep working.
export type {
  UpsertBudgetInput,
  UpsertTierBudgetInput,
  BudgetActuals,
  BudgetsApi,
} from '@rinciku/domain/budgets';

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
