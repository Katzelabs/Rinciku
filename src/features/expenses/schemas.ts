import { z } from 'zod';

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
  currency: z.enum(['IDR', 'USD'], { message: 'Pick a currency' }),
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
