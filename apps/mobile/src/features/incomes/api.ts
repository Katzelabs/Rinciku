import { createIncomesApi } from '@rinciku/domain/incomes';

import { supabase } from '@/lib/supabase';

// Shared data layer (@rinciku/domain) bound to the mobile Supabase client — the
// same shim pattern as features/expenses/api.ts. Receipt attachments and CSV
// import are web-only for now, so only the CRUD + source methods are bound here.
const api = createIncomesApi(supabase);

export const {
  listIncomes,
  sumIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  listIncomeCategories,
  createIncomeCategory,
  updateIncomeCategory,
  deleteIncomeCategory,
} = api;

export type { IncomesApi } from '@rinciku/domain/incomes';
