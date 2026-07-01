// Period + budget-status helpers live in @rinciku/domain (shared with mobile);
// re-exported here so existing call sites (`import { budgetStatus } from
// '../lib/period'`) keep working.
export {
  cycleToPeriod,
  budgetStatus,
  APPROACHING_THRESHOLD,
  OVER_THRESHOLD,
  type Period,
  type BudgetStatus,
} from '@rinciku/domain/budgets';
