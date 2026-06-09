import { z } from 'zod';

import { CURRENCY_CODES } from '@/lib/fx';

export const essentialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name must be 80 characters or fewer'),
  estimated_amount: z
    .number({ message: 'Enter an estimated amount' })
    .refine((v) => !Number.isNaN(v), { message: 'Enter an estimated amount' })
    .positive('Amount must be greater than 0'),
  currency: z.enum(CURRENCY_CODES, { message: 'Pick a currency' }),
  category_id: z.string().uuid('Pick a category'),
  notes: z
    .string()
    .trim()
    .max(280, 'Notes must be 280 characters or fewer')
    .optional()
    .or(z.literal('')),
});

export type EssentialInput = z.infer<typeof essentialSchema>;
