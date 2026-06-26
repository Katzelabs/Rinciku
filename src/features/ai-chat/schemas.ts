import { z } from 'zod';

import { CURRENCY_CODES } from '@/lib/fx';

// Composer input. A turn needs either text or an attached image; the empty-text
// case is allowed here and gated in the composer (send disabled until one is
// present).
export const composerSchema = z.object({
  text: z.string().trim().max(2000, 'Message is too long').optional(),
});

export type ComposerInput = z.infer<typeof composerSchema>;

// Validates the raw `input` of a propose_expense / propose_income tool call
// before we trust it. Tolerant of nullish optional fields the model may omit.
export const proposalToolInputSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(CURRENCY_CODES).catch('IDR'),
  category_hint: z.string().nullish(),
  occurred_at: z.string().nullish(),
  note: z.string().nullish(),
  confidence: z.number().min(0).max(1).nullish(),
  doc_type: z
    .enum(['receipt', 'transfer', 'invoice', 'ewallet', 'unknown'])
    .nullish(),
});

export type ProposalToolInput = z.infer<typeof proposalToolInputSchema>;

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

const noteField = z
  .string()
  .trim()
  .max(280, 'Note must be 280 characters or fewer')
  .optional()
  .or(z.literal(''));

// Editable confirm forms for the inline proposal cards. Unlike the manual
// expense/income forms, currency stays editable here since the AI may extract a
// non-base currency from an image or message.
export const expenseConfirmSchema = z.object({
  amount: z
    .number({ message: 'Enter an amount' })
    .positive('Amount must be greater than 0'),
  currency: z.enum(CURRENCY_CODES, { message: 'Pick a currency' }),
  category_id: z.string().uuid('Pick a category'),
  occurred_at: z
    .date({ message: 'Pick a date' })
    .max(endOfToday(), 'Date cannot be in the future'),
  note: noteField,
});

export type ExpenseConfirmInput = z.infer<typeof expenseConfirmSchema>;

export const incomeConfirmSchema = z.object({
  amount: z
    .number({ message: 'Enter an amount' })
    .positive('Amount must be greater than 0'),
  currency: z.enum(CURRENCY_CODES, { message: 'Pick a currency' }),
  source_id: z.string().uuid().or(z.literal('')).optional(),
  occurred_at: z
    .date({ message: 'Pick a date' })
    .max(endOfToday(), 'Date cannot be in the future'),
  note: noteField,
});

export type IncomeConfirmInput = z.infer<typeof incomeConfirmSchema>;

// Validates the raw `input` of a propose_change tool call (the generic CRUD
// proposal for categories, essentials, budgets, tiers, income sources, and
// expense/income edits + deletes). `data` is entity-specific and validated
// again at apply time by the dispatcher.
export const changeToolInputSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  entity: z.enum([
    'expense',
    'income',
    'category',
    'income_category',
    'essential',
    'budget',
    'tier',
  ]),
  id: z.string().nullish(),
  data: z.record(z.string(), z.unknown()).nullish(),
  summary: z.string().min(1),
});

export type ChangeToolInput = z.infer<typeof changeToolInputSchema>;
