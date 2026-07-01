// Health computation lives in @rinciku/domain (shared with mobile); re-export
// so existing web call sites (`import { computeHealth } from '../lib/health'`)
// keep working.
export {
  computeHealth,
  type HealthStatus,
  type HealthInput,
} from '@rinciku/domain/dashboard';
