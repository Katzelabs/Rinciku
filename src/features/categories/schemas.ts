import { z } from 'zod';

export const TIERS = ['fixed', 'needs', 'wants'] as const;

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(40, 'Keep it under 40 characters'),
  tier: z.enum(TIERS),
  icon: z.string().min(1, 'Pick an icon'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #RRGGBB hex'),
});

export type CategoryInput = z.infer<typeof categorySchema>;
