// Re-export the shared income Zod schema factories from @rinciku/domain so the
// mobile forms validate identically to web.
export {
  makeIncomeSchema,
  makeIncomeCategorySchema,
  type IncomeInput,
  type IncomeCategoryInput,
} from '@rinciku/domain/incomes';
