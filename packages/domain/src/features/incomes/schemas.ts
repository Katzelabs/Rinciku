import { z } from 'zod';
import type { TFunction } from 'i18next';

import { type CurrencyCode } from '@rinciku/core';
import { isCurrencyCode, parseCsvDate } from '@rinciku/core';

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function makeIncomeSchema(t: TFunction) {
  return z.object({
    amount: z
      .number({ message: t('errors.amountRequired') })
      .refine((v) => !Number.isNaN(v), { message: t('errors.amountRequired') })
      .positive(t('errors.amountPositive')),
    // Optional — income may stay uncategorized. '' represents "no source" in the
    // form; the submit handler maps it to null.
    source_id: z.string().uuid().or(z.literal('')).optional(),
    occurred_at: z
      .date({ message: t('errors.dateRequired') })
      .max(endOfToday(), t('errors.dateFuture')),
    note: z
      .string()
      .trim()
      .max(280, t('errors.noteTooLong'))
      .optional()
      .or(z.literal('')),
  });
}

export type IncomeInput = z.infer<ReturnType<typeof makeIncomeSchema>>;

// Validates one raw CSV row (every cell is a string post-parse). Identical in
// shape to expenseCsvRowSchema; the `category` name resolves to a source_id
// downstream in the import dialog, not here.
export function makeIncomeCsvRowSchema(t: TFunction) {
  return z.object({
    date: z.string().refine((v) => parseCsvDate(v) !== null, {
      message: t('errors.csvDateUnparseable'),
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
      .refine(isCurrencyCode, { message: t('errors.csvCurrencyUnsupported') })
      .transform((v) => v.toUpperCase() as CurrencyCode),
    category: z.string().trim().optional().default(''),
    note: z
      .string()
      .trim()
      .max(280, t('errors.csvNoteTooLong'))
      .optional()
      .default(''),
  });
}

export type IncomeCsvRow = z.infer<ReturnType<typeof makeIncomeCsvRowSchema>>;

// Flat income taxonomy form (no tier). Mirrors categorySchema minus tier_id.
export function makeIncomeCategorySchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('errors.nameRequired'))
      .max(40, t('errors.nameTooLong')),
    icon: z.string().min(1, t('errors.iconRequired')),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, t('errors.colorInvalid')),
  });
}

export type IncomeCategoryInput = z.infer<
  ReturnType<typeof makeIncomeCategorySchema>
>;
