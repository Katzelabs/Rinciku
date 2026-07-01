// Zod schema factory (makeX(t)) lives in @rinciku/domain (shared with web,
// i18n-aware). Re-exported so forms can import it from the feature.
export { makeExpenseSchema } from '@rinciku/domain/expenses';

export type { ExpenseInput } from '@rinciku/domain/expenses';
