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
