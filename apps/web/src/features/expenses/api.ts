import { createExpensesApi } from '@rinciku/domain/expenses';
import { supabase } from '@/lib/supabase';

// Data layer lives in @rinciku/domain (shared with mobile); this thin shim binds
// it to the web Supabase client and re-exports the named functions + types so
// existing call sites (`import { listExpenses } from '../api'`) keep working.
export type {
  CategoryWithTier,
  ExpenseWithRelations,
  ListExpensesParams,
  SumExpensesParams,
  ExpenseAmountRow,
  CreateExpenseInput,
  CreateAttachmentInput,
  UploadAttachmentOptions,
  ExpensesApi,
} from '@rinciku/domain/expenses';

const api = createExpensesApi(supabase);

export const {
  listExpenses,
  sumExpenses,
  getExpense,
  createExpense,
  bulkCreateExpenses,
  updateExpense,
  deleteExpense,
  uploadAttachment,
  createAttachment,
  updateAttachment,
  getAttachmentSignedUrl,
  deleteAttachment,
  deleteAttachmentObject,
} = api;
