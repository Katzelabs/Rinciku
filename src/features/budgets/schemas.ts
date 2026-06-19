import { z } from 'zod';

import { CURRENCY_CODES } from '@/lib/fx';

// A single budget target (per-category or per-tier cap). Amount may be 0 to
// represent an explicit "no spending" cap. Currency is locked to the user's
// base at write time, mirroring expenses/essentials.
export const budgetTargetSchema = z.object({
  amount: z
    .number({ message: 'Enter an amount' })
    .refine((v) => !Number.isNaN(v), { message: 'Enter an amount' })
    .min(0, 'Amount cannot be negative'),
  currency: z.enum(CURRENCY_CODES, { message: 'Pick a currency' }),
});

export type BudgetTargetInput = z.infer<typeof budgetTargetSchema>;
