import { createIncomesApi } from '@rinciku/domain/incomes';

import { supabase } from '@/lib/supabase';

// Shared data layer (@rinciku/domain) bound to the mobile Supabase client — the
// same shim pattern as features/expenses/api.ts. CSV import stays web-only; the
// income-attachment methods are bound too (proof upload now works on mobile).
// The File-based `uploadIncomeAttachment` is intentionally NOT re-exported —
// native upload goes through `uploadAttachmentObject` in @/lib/attachments.
const api = createIncomesApi(supabase);

export const {
  listIncomes,
  sumIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  listIncomeCategories,
  createIncomeCategory,
  updateIncomeCategory,
  deleteIncomeCategory,
  createIncomeAttachment,
  updateIncomeAttachment,
  getIncomeAttachmentSignedUrl,
  deleteIncomeAttachment,
  deleteIncomeAttachmentObject,
} = api;

export type { IncomesApi } from '@rinciku/domain/incomes';
