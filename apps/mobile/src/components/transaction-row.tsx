import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { useTheme } from '@/hooks/use-theme';

// Shared transaction row for the expenses + incomes lists: a tinted category/
// source icon badge, a title + subtitle, and the amount in its original
// currency. Income passes a leading '+' and the primary tint; expenses stay
// neutral. Tapping opens the detail screen.
export function TransactionRow({
  icon,
  color,
  title,
  subtitle,
  amount,
  currency,
  sign,
  amountColor,
  onPress,
  topBorder,
}: {
  icon?: string | null;
  color?: string | null;
  title: string;
  subtitle?: string | null;
  amount: number;
  currency: CurrencyCode;
  /** Leading sign shown before the amount (e.g. '+' for income). */
  sign?: string;
  /** Overrides the amount color (defaults to the foreground token). */
  amountColor?: string;
  onPress: () => void;
  topBorder?: boolean;
}) {
  const c = useTheme();

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={`${title}, ${sign ?? ''}${formatCurrency(amount, currency)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        topBorder && {
          borderTopColor: c.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: `${color ?? '#8d8d8d'}22` },
        ]}
      >
        <CategoryIcon name={icon} size={18} color={color ?? c.foreground} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: c.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: c.mutedForeground }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text
        style={[styles.amount, { color: amountColor ?? c.foreground }]}
        numberOfLines={1}
      >
        {sign}
        {formatCurrency(amount, currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: Fonts.medium, fontSize: 15 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 13 },
  amount: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    flexShrink: 0,
    maxWidth: '42%',
  },
});
