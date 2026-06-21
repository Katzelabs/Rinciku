import { z } from 'zod';

import { type CurrencyCode } from '@/lib/fx';
import { isCurrencyCode, parseCsvDate } from '@/lib/csv';

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export const incomeSchema = z.object({
  amount: z
    .number({ message: 'Enter an amount' })
    .refine((v) => !Number.isNaN(v), { message: 'Enter an amount' })
    .positive('Amount must be greater than 0'),
  // Optional — income may stay uncategorized. '' represents "no source" in the
  // form; the submit handler maps it to null.
  source_id: z.string().uuid().or(z.literal('')).optional(),
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

export type IncomeInput = z.infer<typeof incomeSchema>;

// Validates one raw CSV row (every cell is a string post-parse). Identical in
// shape to expenseCsvRowSchema; the `category` name resolves to a source_id
// downstream in the import dialog, not here.
export const incomeCsvRowSchema = z.object({
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

export type IncomeCsvRow = z.infer<typeof incomeCsvRowSchema>;

// Flat income taxonomy form (no tier). Mirrors categorySchema minus tier_id.
export const incomeCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(40, 'Keep it under 40 characters'),
  icon: z.string().min(1, 'Pick an icon'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #RRGGBB hex'),
});

export type IncomeCategoryInput = z.infer<typeof incomeCategorySchema>;
