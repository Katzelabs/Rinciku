import { createDashboardApi } from '@rinciku/domain/dashboard';

import { supabase } from '@/lib/supabase';

// Shared aggregation + filterable analytics layer (@rinciku/domain) bound to the
// mobile Supabase client. `getMonthlySummary` powers the current-cycle budget
// section; the analytics functions (trend / breakdown / budget-vs-actual) drive
// the range-scoped summary cards and charts.
const api = createDashboardApi(supabase);

export const {
  getMonthlySummary,
  getSpendTrend,
  getCategoryBreakdown,
  getBudgetVsActual,
} = api;

export type { DashboardApi } from '@rinciku/domain/dashboard';
