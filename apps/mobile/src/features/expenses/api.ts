import { createExpensesApi } from '@rinciku/domain/expenses';

import { supabase } from '@/lib/supabase';

// Shared data layer (@rinciku/domain) bound to the mobile Supabase client — the
// same shim pattern as features/auth/api.ts. CSV bulk import stays web-only; the
// attachment methods are bound too (receipt upload now works on mobile). Note
// the File-based `uploadAttachment` is intentionally NOT re-exported — native
// upload goes through `uploadAttachmentObject` in @/lib/attachments instead.
const api = createExpensesApi(supabase);

export const {
  listExpenses,
  sumExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  createAttachment,
  updateAttachment,
  getAttachmentSignedUrl,
  deleteAttachment,
  deleteAttachmentObject,
} = api;

export type { ExpensesApi } from '@rinciku/domain/expenses';
