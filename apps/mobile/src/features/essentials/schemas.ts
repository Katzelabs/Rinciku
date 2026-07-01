// Zod schema factory (makeX(t)) lives in @rinciku/domain (shared with web,
// i18n-aware). Re-exported so forms can import it from the feature.
export { makeEssentialSchema } from '@rinciku/domain/essentials';

export type { EssentialInput } from '@rinciku/domain/essentials';
