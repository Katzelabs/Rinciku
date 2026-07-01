import type { Tables } from '@rinciku/db';

/**
 * Portable category taxonomy constants + grouping, shared by web and mobile.
 * These carry no platform imports (the icon *names* are plain strings — each app
 * renders them with its own lucide binding: `lucide-react` on web,
 * `lucide-react-native` on mobile).
 */

// Curated PascalCase lucide icon keys offered in the category picker.
export const CATEGORY_ICONS = [
  'Home',
  'Wifi',
  'Zap',
  'Droplet',
  'Flame',
  'ShoppingCart',
  'ShoppingBag',
  'Car',
  'Bus',
  'Train',
  'Fuel',
  'HeartPulse',
  'Stethoscope',
  'Pill',
  'Dumbbell',
  'UtensilsCrossed',
  'Coffee',
  'Tv',
  'Gamepad2',
  'BookOpen',
  'GraduationCap',
  'Plane',
  'Gift',
  'Receipt',
  'CreditCard',
  'Wallet',
  'Banknote',
  'PiggyBank',
  'Briefcase',
  'TrendingUp',
  'Shirt',
  'Phone',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

// Olive-family swatches offered for tiers/categories.
export const PRESET_COLORS = [
  '#7a8d6a',
  '#a3a86b',
  '#c4a86b',
  '#b07a6b',
  '#a36b6b',
  '#a36b8d',
  '#8d6ba3',
  '#6b8da3',
  '#6ba38d',
  '#8d8d8d',
] as const;

export type PresetColor = (typeof PRESET_COLORS)[number];

// Per-user caps on the spending taxonomy. Kept in sync with the DB triggers in
// supabase/schemas/10_tiers.sql and 11_categories.sql.
export const MAX_TIERS = 6;
export const MAX_CATEGORIES_PER_TIER = 15;

type Category = Tables<'categories'>;
export type Tier = Tables<'tiers'>;

export type TierGroup = { tier: Tier | null; categories: Category[] };

// Group categories under their tier, ordered by the tiers list. Categories with
// no tier (or whose tier was deleted) collect into a trailing "Untiered" group
// (tier === null).
export function groupByTier(
  categories: Category[],
  tiers: Tier[]
): TierGroup[] {
  const tierIds = new Set(tiers.map((t) => t.id));
  const byTier = new Map<string, Category[]>();
  const untiered: Category[] = [];

  for (const category of categories) {
    if (category.tier_id && tierIds.has(category.tier_id)) {
      const bucket = byTier.get(category.tier_id) ?? [];
      bucket.push(category);
      byTier.set(category.tier_id, bucket);
    } else {
      untiered.push(category);
    }
  }

  const groups: TierGroup[] = tiers.map((tier) => ({
    tier,
    categories: byTier.get(tier.id) ?? [],
  }));
  if (untiered.length > 0) {
    groups.push({ tier: null, categories: untiered });
  }
  return groups;
}
