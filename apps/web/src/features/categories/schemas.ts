import { z } from 'zod';
import type { TFunction } from 'i18next';

export function makeCategorySchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('errors.nameRequired'))
      .max(40, t('errors.nameMax')),
    tier_id: z.string().uuid(t('errors.tierRequired')),
    icon: z.string().min(1, t('errors.iconRequired')),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, t('errors.colorInvalid')),
  });
}

export type CategoryInput = z.infer<ReturnType<typeof makeCategorySchema>>;

export function makeTierSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('errors.nameRequired'))
      .max(40, t('errors.nameMax')),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, t('errors.colorInvalid')),
    is_essential: z.boolean(),
  });
}

export type TierInput = z.infer<ReturnType<typeof makeTierSchema>>;
