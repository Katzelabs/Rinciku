import { z } from 'zod';
import type { TFunction } from 'i18next';

import { CURRENCY_CODES } from '@/lib/fx';

// A single budget target (per-category or per-tier cap). Amount may be 0 to
// represent an explicit "no spending" cap. Currency is locked to the user's
// base at write time, mirroring expenses/essentials.
export function makeBudgetTargetSchema(t: TFunction) {
  return z.object({
    amount: z
      .number({ message: t('errors.amountRequired') })
      .refine((v) => !Number.isNaN(v), { message: t('errors.amountRequired') })
      .min(0, t('errors.amountNegative')),
    currency: z.enum(CURRENCY_CODES, { message: t('errors.currencyRequired') }),
  });
}

export type BudgetTargetInput = z.infer<
  ReturnType<typeof makeBudgetTargetSchema>
>;
