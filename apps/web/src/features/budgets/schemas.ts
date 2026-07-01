// Budget schema lives in @rinciku/domain (shared with mobile); re-exported here
// so existing call sites (`import { makeBudgetTargetSchema } from '../schemas'`)
// keep working.
export {
  makeBudgetTargetSchema,
  type BudgetTargetInput,
} from '@rinciku/domain/budgets';
