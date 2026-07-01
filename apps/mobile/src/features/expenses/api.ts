import { createExpensesApi } from '@rinciku/domain/expenses';

import { supabase } from '@/lib/supabase';

// Shared data layer (@rinciku/domain) bound to the mobile Supabase client — the
// same shim pattern as features/auth/api.ts. Only the non-attachment/non-bulk
// methods are re-exported; receipt attachments and CSV import are web-only for
// now (see the M8 plan).
const api = createExpensesApi(supabase);

export const {
  listExpenses,
  sumExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} = api;

export type { ExpensesApi } from '@rinciku/domain/expenses';
