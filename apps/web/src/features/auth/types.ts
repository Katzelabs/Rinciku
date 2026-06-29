// Profile type lives in @rinciku/domain (shared with mobile); re-exported here
// so existing call sites (`import type { Profile } from '../types'`) keep working.
export type { Profile } from '@rinciku/domain/auth';
