import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/hooks/use-theme';

const FALLBACK_COLOR = '#8d8d8d';

interface CategoryBadgeProps {
  icon?: string | null;
  color?: string | null;
  /** Diameter of the round badge. Icon scales to ~45% of it. Defaults to 40. */
  size?: number;
}

/**
 * The tinted round category/source medallion — a category icon over a soft tint
 * of its own color. Extracted from the copies inline in TransactionRow, the
 * expense filters, essentials, and the detail screen.
 */
export function CategoryBadge({ icon, color, size = 40 }: CategoryBadgeProps) {
  const c = useTheme();
  const resolved = color ?? FALLBACK_COLOR;
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, backgroundColor: withAlpha(resolved, '22') },
      ]}
    >
      <CategoryIcon
        name={icon}
        size={Math.round(size * 0.45)}
        color={color ?? c.foreground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
