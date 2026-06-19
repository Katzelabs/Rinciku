import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(40, 'Keep it under 40 characters'),
  tier_id: z.string().uuid('Pick a tier'),
  icon: z.string().min(1, 'Pick an icon'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #RRGGBB hex'),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const tierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(40, 'Keep it under 40 characters'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #RRGGBB hex'),
  is_essential: z.boolean(),
});

export type TierInput = z.infer<typeof tierSchema>;
