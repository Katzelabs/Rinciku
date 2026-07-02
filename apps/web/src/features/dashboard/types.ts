// Analytics (charts + filters) types now live in @rinciku/domain/dashboard
// (shared with mobile). Re-exported here so the feature-local `../types`
// imports across the dashboard components keep resolving.
export type {
  BucketGranularity,
  AnalyticsFilters,
  TrendPoint,
  BreakdownItem,
  CategoryBreakdown,
  BudgetComparisonItem,
} from '@rinciku/domain/dashboard';
