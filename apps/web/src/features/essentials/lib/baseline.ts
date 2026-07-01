// Baseline computation lives in @rinciku/domain (shared with mobile); re-export
// so existing web call sites (`import { computeBaseline } from '../lib/baseline'`)
// keep working.
export { computeBaseline, type Baseline } from '@rinciku/domain/essentials';
