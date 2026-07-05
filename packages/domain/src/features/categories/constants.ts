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

// Emoji rendered for each curated icon key. The category's stored `icon` value
// stays the lucide name (so the picker and data model are unchanged) — apps map
// it to an emoji at render time for the friendlier, full-color "chip" look.
// Kept to widely-supported single/VS16 emoji so they render on both iOS and
// Android. Unknown/legacy names fall back to the 🏷️ tag, mirroring the icon.
const CATEGORY_EMOJI: Record<CategoryIconName, string> = {
  Home: '🏠',
  Wifi: '📶',
  Zap: '⚡',
  Droplet: '💧',
  Flame: '🔥',
  ShoppingCart: '🛒',
  ShoppingBag: '🛍️',
  Car: '🚗',
  Bus: '🚌',
  Train: '🚆',
  Fuel: '⛽',
  HeartPulse: '❤️',
  Stethoscope: '🩺',
  Pill: '💊',
  Dumbbell: '💪',
  UtensilsCrossed: '🍽️',
  Coffee: '☕',
  Tv: '📺',
  Gamepad2: '🎮',
  BookOpen: '📖',
  GraduationCap: '🎓',
  Plane: '✈️',
  Gift: '🎁',
  Receipt: '🧾',
  CreditCard: '💳',
  Wallet: '👛',
  Banknote: '💵',
  PiggyBank: '🐷',
  Briefcase: '💼',
  TrendingUp: '📈',
  Shirt: '👕',
  Phone: '📱',
};

const DEFAULT_CATEGORY_EMOJI = '🏷️';

/** Emoji for a category's stored icon name (🏷️ for unknown/empty). */
export function categoryEmoji(name?: string | null): string {
  return (name && CATEGORY_EMOJI[name as CategoryIconName]) || DEFAULT_CATEGORY_EMOJI;
}

// Category/tier swatches. Vivid enough to scan a transaction list by color at a
// glance (the previous muted-olive set read as a wall of near-identical gray),
// but still tuned to the brand's warm-green world. The trailing swatch is a
// neutral, offered in the picker but never chosen by `categoryColorFor`.
export const PRESET_COLORS = [
  '#5B8C2A', // leaf green
  '#3B82C4', // blue
  '#E08A1E', // amber
  '#8B5CF6', // violet
  '#0EA5A5', // teal
  '#4F6BED', // indigo
  '#E05252', // red
  '#D9557F', // rose
  '#6B8D23', // olive
  '#8A8A72', // neutral
] as const;

export type PresetColor = (typeof PRESET_COLORS)[number];

// The colorful subset (drops the trailing neutral) used for the deterministic
// fallback, so a colorless / uncategorized row is never the anonymous gray tag.
const FALLBACK_COLORS = PRESET_COLORS.slice(0, -1);

/**
 * Deterministic category color from a stable seed (category id, or name when no
 * id is available). Same seed → same hue across sessions and on both web and
 * mobile, so a row's color badge stays stable even when the category itself
 * carries no `color`. Use as the fallback wherever a category color is rendered:
 * `category.color ?? categoryColorFor(category.id)`.
 */
export function categoryColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

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
