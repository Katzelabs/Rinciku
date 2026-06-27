import { z } from 'zod';
import type { TFunction } from 'i18next';

import { CURRENCY_CODES } from '@/lib/fx';

export function makeEssentialSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('errors.nameRequired'))
      .max(80, t('errors.nameMax')),
    estimated_amount: z
      .number({ message: t('errors.amountRequired') })
      .refine((v) => !Number.isNaN(v), { message: t('errors.amountRequired') })
      .positive(t('errors.amountPositive')),
    currency: z.enum(CURRENCY_CODES, { message: t('errors.currencyRequired') }),
    category_id: z.string().uuid(t('errors.categoryRequired')),
    notes: z
      .string()
      .trim()
      .max(280, t('errors.notesMax'))
      .optional()
      .or(z.literal('')),
  });
}

export type EssentialInput = z.infer<ReturnType<typeof makeEssentialSchema>>;
