import type { Tables, TypedSupabaseClient } from '@rinciku/db';
import {
  convertToBase,
  ensureRates,
  getCurrentCycle,
  getCurrentRates,
  type CurrencyCode,
  type Cycle,
} from '@rinciku/core';

import type { Profile } from '../auth/types';
import { createCategoriesApi, groupByTier, type Tier } from '../categories';
import { createBudgetsApi } from './api';
import { budgetStatus, cycleToPeriod, type BudgetStatus, type Period } from './period';

type Category = Tables<'categories'>;

export type BudgetCategoryRow = {
  category: Category;
  budgetId: string | null;
  // target/spent are in the user's base currency. targetRaw/targetCurrency
  // preserve the stored value so an edit form can show the original.
  target: number | null;
  targetRaw: number | null;
  targetCurrency: CurrencyCode;
  spent: number;
  pct: number | null;
  status: BudgetStatus;
};

export type BudgetTierSection = {
  tier: Tier | null;
  tierBudgetId: string | null;
  target: number | null;
  targetRaw: number | null;
  targetCurrency: CurrencyCode;
  spent: number;
  pct: number | null;
  status: BudgetStatus;
  categories: BudgetCategoryRow[];
};

export type BudgetsView = {
  period: Period;
  cycle: Cycle;
  base: CurrencyCode;
  sections: BudgetTierSection[];
  overCount: number;
  approachingCount: number;
  // Number of targets actually set (category budgets + tier caps).
  targetCount: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pctOf(spent: number, target: number | null): number | null {
  if (target == null || target <= 0) return null;
  return round2(spent / target);
}

// Orchestrates profile → cycle → period → targets + actuals → per-tier view
// model. Mirrors dashboard's getMonthlySummary: ensureRates() before the RPC,
// half-open window [start, end+1ms), FX conversion to the user's base. The
// Supabase client is injected so web and native share one copy.
export async function getBudgetsView(
  db: TypedSupabaseClient,
  profile: Profile,
  now: Date = new Date()
): Promise<{ data: BudgetsView | null; error: string | null }> {
  const categoriesApi = createCategoriesApi(db);
  const budgetsApi = createBudgetsApi(db);

  const cycle = getCurrentCycle(profile, now);
  const period = cycleToPeriod(cycle);
  const base = (profile.base_currency ?? 'IDR') as CurrencyCode;
  const endExclusive = new Date(cycle.end.getTime() + 1).toISOString();

  await ensureRates();

  const [categoriesRes, tiersRes, budgetsRes, tierBudgetsRes, actualsRes] =
    await Promise.all([
      categoriesApi.listCategories(),
      categoriesApi.listTiers(),
      budgetsApi.listBudgets(period.year, period.month),
      budgetsApi.listTierBudgets(period.year, period.month),
      budgetsApi.getBudgetActuals(
        cycle.start.toISOString(),
        endExclusive,
        base,
        getCurrentRates()
      ),
    ]);

  const firstError =
    categoriesRes.error ??
    tiersRes.error ??
    budgetsRes.error ??
    tierBudgetsRes.error ??
    actualsRes.error;
  if (firstError) return { data: null, error: firstError.message };

  const categories = categoriesRes.data ?? [];
  const tiers = tiersRes.data ?? [];
  const actuals = actualsRes.data ?? { by_category: {}, by_tier: {} };

  // Index targets by category / tier for O(1) lookup.
  const budgetByCategory = new Map(
    (budgetsRes.data ?? []).map((b) => [b.category_id, b])
  );
  const tierBudgetByTier = new Map(
    (tierBudgetsRes.data ?? []).map((b) => [b.tier_id, b])
  );

  let overCount = 0;
  let approachingCount = 0;
  let targetCount = 0;
  const tally = (status: BudgetStatus) => {
    if (status === 'none') return;
    targetCount += 1;
    if (status === 'over') overCount += 1;
    else if (status === 'approaching') approachingCount += 1;
  };

  const sections: BudgetTierSection[] = groupByTier(categories, tiers).map(
    (group) => {
      const categoryRows: BudgetCategoryRow[] = group.categories.map((cat) => {
        const budget = budgetByCategory.get(cat.id) ?? null;
        const targetCurrency = (budget?.currency ?? base) as CurrencyCode;
        const target = budget
          ? round2(
              convertToBase(Number(budget.amount), targetCurrency, base)
                .amount_base
            )
          : null;
        const spent = round2(actuals.by_category[cat.id] ?? 0);
        const status = budgetStatus(spent, target);
        tally(status);
        return {
          category: cat,
          budgetId: budget?.id ?? null,
          target,
          targetRaw: budget ? Number(budget.amount) : null,
          targetCurrency,
          spent,
          pct: pctOf(spent, target),
          status,
        };
      });

      const tier = group.tier;
      const tierBudget = tier ? (tierBudgetByTier.get(tier.id) ?? null) : null;
      const tierTargetCurrency = (tierBudget?.currency ?? base) as CurrencyCode;
      const tierTarget = tierBudget
        ? round2(
            convertToBase(Number(tierBudget.amount), tierTargetCurrency, base)
              .amount_base
          )
        : null;
      const tierSpent = tier ? round2(actuals.by_tier[tier.id] ?? 0) : 0;
      const tierStatus = budgetStatus(tierSpent, tierTarget);
      tally(tierStatus);

      return {
        tier,
        tierBudgetId: tierBudget?.id ?? null,
        target: tierTarget,
        targetRaw: tierBudget ? Number(tierBudget.amount) : null,
        targetCurrency: tierTargetCurrency,
        spent: tierSpent,
        pct: pctOf(tierSpent, tierTarget),
        status: tierStatus,
        categories: categoryRows,
      };
    }
  );

  return {
    data: {
      period,
      cycle,
      base,
      sections,
      overCount,
      approachingCount,
      targetCount,
    },
    error: null,
  };
}
