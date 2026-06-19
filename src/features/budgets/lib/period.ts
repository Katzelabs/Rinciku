import type { Cycle } from '@/lib/cycle';

export type Period = { year: number; month: number };

// A cycle is labelled by its start month (locked decision): the cycle that
// begins 2026-06-19 is period { year: 2026, month: 6 }.
export function cycleToPeriod(cycle: Cycle): Period {
  return {
    year: cycle.start.getFullYear(),
    month: cycle.start.getMonth() + 1,
  };
}

export type BudgetStatus = 'ok' | 'approaching' | 'over' | 'none';

// Thresholds (tunable): ok < 80% ≤ approaching ≤ 100% < over.
export const APPROACHING_THRESHOLD = 0.8;
export const OVER_THRESHOLD = 1;

// pct is spent / target. A null/zero target has no status ('none').
export function budgetStatus(
  spent: number,
  target: number | null
): BudgetStatus {
  if (target == null || target <= 0) return 'none';
  const pct = spent / target;
  if (pct < APPROACHING_THRESHOLD) return 'ok';
  if (pct <= OVER_THRESHOLD) return 'approaching';
  return 'over';
}
