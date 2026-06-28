// Analytics (charts + filters) types. The cycle-snapshot types live in api.ts
// (MonthlySummary); these cover the filterable analytics section below it.

export type BucketGranularity = 'day' | 'week' | 'month';

// The analytics section owns its own date range + category filter, independent
// of the current-cycle snapshot at the top of the dashboard.
export type AnalyticsFilters = {
  from: Date;
  to: Date;
  categoryIds: string[];
};

// One point on the spend/income trend. `bucket` is the ISO date (yyyy-MM-dd) at
// the start of the bucket; `label` is the pre-formatted axis label.
export type TrendPoint = {
  bucket: string;
  label: string;
  spent: number;
  income: number;
};

// A single slice of a category/tier breakdown (donut + bar charts).
export type BreakdownItem = {
  id: string;
  name: string;
  color: string;
  amount: number;
};

export type CategoryBreakdown = {
  byCategory: BreakdownItem[];
  byTier: BreakdownItem[];
};

// Target vs actual spend for one category over the selected range.
export type BudgetComparisonItem = {
  id: string;
  name: string;
  color: string;
  target: number;
  actual: number;
};
