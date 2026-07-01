// Zod schema factories (makeX(t)) live in @rinciku/domain (shared with web).
// Re-exported so screens/forms can import them from the feature.
export { makeCategorySchema, makeTierSchema } from '@rinciku/domain/categories';

export type { CategoryInput, TierInput } from '@rinciku/domain/categories';
