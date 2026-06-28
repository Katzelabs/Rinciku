export type HealthStatus = 'on-track' | 'watch' | 'over';

// `spent` + `days_elapsed` are optional so per-category surfaces (which don't
// have a cycle-level burn rate) can still reuse this rule for the 'over' check.
// Without them the 'watch' tier is skipped.
export type HealthInput = {
  remaining: number;
  days_left: number;
  baseline_uncovered: number;
  spent?: number;
  days_elapsed?: number;
};

export function computeHealth(input: HealthInput): HealthStatus {
  const { remaining, days_left, baseline_uncovered, spent, days_elapsed } =
    input;
  if (remaining < 0 || remaining < baseline_uncovered) return 'over';
  if (
    spent !== undefined &&
    days_elapsed !== undefined &&
    days_elapsed > 0 &&
    days_left > 0
  ) {
    const burnRate = spent / days_elapsed;
    if (burnRate * days_left > remaining) return 'watch';
  }
  return 'on-track';
}
