// Portable Zod schemas live in @rinciku/domain/ai-chat (shared by web + mobile).
export {
  composerSchema,
  proposalToolInputSchema,
  changeToolInputSchema,
  makeExpenseConfirmSchema,
  makeIncomeConfirmSchema,
} from '@rinciku/domain/ai-chat';
export type {
  ComposerInput,
  ProposalToolInput,
  ExpenseConfirmInput,
  IncomeConfirmInput,
  ChangeToolInput,
} from '@rinciku/domain/ai-chat';
