// Schemas live in @rinciku/domain (shared with mobile); re-exported here so
// existing call sites (`import { makeCategorySchema } from '../schemas'`) keep working.
export {
  makeCategorySchema,
  makeTierSchema,
  type CategoryInput,
  type TierInput,
} from '@rinciku/domain/categories';
