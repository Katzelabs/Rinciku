import { z } from 'zod';

import { CURRENCY_CODES, type CurrencyCode } from '@/lib/fx';
import { isCurrencyCode, parseCsvDate } from '@/lib/csv';

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export const expenseSchema = z.object({
  amount: z
    .number({ message: 'Enter an amount' })
    .refine((v) => !Number.isNaN(v), { message: 'Enter an amount' })
    .positive('Amount must be greater than 0'),
  currency: z.enum(CURRENCY_CODES, { message: 'Pick a currency' }),
  category_id: z.string().uuid('Pick a category'),
  occurred_at: z
    .date({ message: 'Pick a date' })
    .max(endOfToday(), 'Date cannot be in the future'),
  note: z
    .string()
    .trim()
    .max(280, 'Note must be 280 characters or fewer')
    .optional()
    .or(z.literal('')),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

// Validates one raw CSV row (every cell is a string post-parse), distinct from
// the form schema above. Coerces to typed values; the category NAME is resolved
// to an id later in the import dialog (that needs the fetched category list,
// which a pure schema shouldn't depend on).
export const expenseCsvRowSchema = z.object({
  date: z
    .string()
    .refine((v) => parseCsvDate(v) !== null, { message: 'Unparseable date' }),
  amount: z
    .string()
    .transform((v) => Number(v.replace(/,/g, '').trim()))
    .refine((n) => Number.isFinite(n) && n > 0, {
      message: 'Amount must be a number greater than 0',
    }),
  currency: z
    .string()
    .trim()
    .refine(isCurrencyCode, { message: 'Unsupported currency' })
    .transform((v) => v.toUpperCase() as CurrencyCode),
  category: z.string().trim().optional().default(''),
  note: z.string().trim().max(280, 'Note too long').optional().default(''),
});

export type ExpenseCsvRow = z.infer<typeof expenseCsvRowSchema>;
