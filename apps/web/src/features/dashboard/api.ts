import { createDashboardApi } from '@rinciku/domain/dashboard';
import { supabase } from '@/lib/supabase';

// The dashboard aggregation + filterable analytics layer lives in
// @rinciku/domain (shared with mobile); this shim binds it to the web Supabase
// client and re-exports the bound functions + types.
export type {
  MonthlySummary,
  TierTotals,
  AnalyticsFilters,
  TrendPoint,
  BreakdownItem,
  CategoryBreakdown,
  BudgetComparisonItem,
  BucketGranularity,
} from '@rinciku/domain/dashboard';

const dashboardApi = createDashboardApi(supabase);

export const {
  getMonthlySummary,
  getSpendTrend,
  getCategoryBreakdown,
  getBudgetVsActual,
} = dashboardApi;
