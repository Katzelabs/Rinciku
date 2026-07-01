// The income Zod schema factories live in the shared @rinciku/domain layer so
// web + mobile validate identically. Re-exported here for the feature-local
// import path used by the web forms.
export {
  makeIncomeSchema,
  makeIncomeCsvRowSchema,
  makeIncomeCategorySchema,
  type IncomeInput,
  type IncomeCsvRow,
  type IncomeCategoryInput,
} from '@rinciku/domain/incomes';
