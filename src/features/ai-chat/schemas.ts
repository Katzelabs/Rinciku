import { z } from 'zod';
import type { TFunction } from 'i18next';

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

function makeNoteField(t: TFunction) {
  return z
    .string()
    .trim()
    .max(280, t('errors.noteTooLong'))
    .optional()
    .or(z.literal(''));
}

// Editable confirm forms for the inline proposal cards. Unlike the manual
// expense/income forms, currency stays editable here since the AI may extract a
// non-base currency from an image or message.
export function makeExpenseConfirmSchema(t: TFunction) {
  return z.object({
    amount: z
      .number({ message: t('errors.amountRequired') })
      .positive(t('errors.amountPositive')),
    currency: z.enum(CURRENCY_CODES, { message: t('errors.currencyRequired') }),
    category_id: z.string().uuid(t('errors.categoryRequired')),
    occurred_at: z
      .date({ message: t('errors.dateRequired') })
      .max(endOfToday(), t('errors.dateFuture')),
    note: makeNoteField(t),
  });
}

export type ExpenseConfirmInput = z.infer<
  ReturnType<typeof makeExpenseConfirmSchema>
>;

export function makeIncomeConfirmSchema(t: TFunction) {
  return z.object({
    amount: z
      .number({ message: t('errors.amountRequired') })
      .positive(t('errors.amountPositive')),
    currency: z.enum(CURRENCY_CODES, { message: t('errors.currencyRequired') }),
    source_id: z.string().uuid().or(z.literal('')).optional(),
    occurred_at: z
      .date({ message: t('errors.dateRequired') })
      .max(endOfToday(), t('errors.dateFuture')),
    note: makeNoteField(t),
  });
}

export type IncomeConfirmInput = z.infer<
  ReturnType<typeof makeIncomeConfirmSchema>
>;

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
