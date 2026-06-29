import { z } from 'zod';
import type { TFunction } from 'i18next';

import { CURRENCY_CODES, type CurrencyCode } from '@rinciku/core';
import { isCurrencyCode, parseCsvDate } from '@rinciku/core';

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function makeExpenseSchema(t: TFunction) {
  return z.object({
    amount: z
      .number({ message: t('errors.amountRequired') })
      .refine((v) => !Number.isNaN(v), { message: t('errors.amountRequired') })
      .positive(t('errors.amountPositive')),
    currency: z.enum(CURRENCY_CODES, { message: t('errors.currencyRequired') }),
    category_id: z.string().uuid(t('errors.categoryRequired')),
    occurred_at: z
      .date({ message: t('errors.dateRequired') })
      .max(endOfToday(), t('errors.dateFuture')),
    note: z
      .string()
      .trim()
      .max(280, t('errors.noteMax'))
      .optional()
      .or(z.literal('')),
  });
}

export type ExpenseInput = z.infer<ReturnType<typeof makeExpenseSchema>>;

// Validates one raw CSV row (every cell is a string post-parse), distinct from
// the form schema above. Coerces to typed values; the category NAME is resolved
// to an id later in the import dialog (that needs the fetched category list,
// which a pure schema shouldn't depend on).
export function makeExpenseCsvRowSchema(t: TFunction) {
  return z.object({
    date: z.string().refine((v) => parseCsvDate(v) !== null, {
      message: t('errors.csvDateInvalid'),
    }),
    amount: z
      .string()
      .transform((v) => Number(v.replace(/,/g, '').trim()))
      .refine((n) => Number.isFinite(n) && n > 0, {
        message: t('errors.csvAmountInvalid'),
      }),
    currency: z
      .string()
      .trim()
      .refine(isCurrencyCode, { message: t('errors.csvCurrencyInvalid') })
      .transform((v) => v.toUpperCase() as CurrencyCode),
    category: z.string().trim().optional().default(''),
    note: z
      .string()
      .trim()
      .max(280, t('errors.csvNoteMax'))
      .optional()
      .default(''),
  });
}

export type ExpenseCsvRow = z.infer<ReturnType<typeof makeExpenseCsvRowSchema>>;
