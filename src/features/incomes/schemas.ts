import { z } from 'zod';

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
