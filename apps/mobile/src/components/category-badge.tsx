import { StyleSheet, View } from 'react-native';

import { categoryColorFor } from '@rinciku/domain/categories';

import { Radius } from '@/constants/theme';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { withAlpha } from '@/lib/color';

interface CategoryBadgeProps {
  icon?: string | null;
  color?: string | null;
  /** Side length of the rounded-square badge. Icon scales to it. Defaults to 40. */
  size?: number;
  /**
   * Stable seed for the deterministic tint when `color` is null (e.g. the
   * category id/name), so the same category keeps the same hue everywhere.
   */
  seed?: string;
}

/**
 * The tinted rounded-square category/source chip — a category emoji over a soft
 * tint of its color. Shared by the expense filters, essentials, and the detail
 * screen. Never renders the old anonymous gray: a colorless category falls back
 * to a stable per-category hue via `categoryColorFor`.
 */
export function CategoryBadge({
  icon,
  color,
  size = 40,
  seed,
}: CategoryBadgeProps) {
  const resolved = color ?? categoryColorFor(seed ?? icon ?? '');
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          backgroundColor: withAlpha(resolved, '22'),
        },
      ]}
    >
      <CategoryIcon name={icon} size={Math.round(size * 0.5)} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
