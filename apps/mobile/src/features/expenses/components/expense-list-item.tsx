import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency, formatDate, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import type { ExpenseWithRelations } from '@/features/expenses/types';
import { useTheme } from '@/hooks/use-theme';

// One expense row: category icon, category name + date, and the amount in its
// original currency. Tapping opens the detail screen.
export function ExpenseListItem({
  expense,
  onPress,
  topBorder,
}: {
  expense: ExpenseWithRelations;
  onPress: () => void;
  topBorder?: boolean;
}) {
  const c = useTheme();
  const category = expense.category;

  return (
    <Pressable
      accessibilityRole='button'
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
          { backgroundColor: `${category?.color ?? '#8d8d8d'}22` },
        ]}
      >
        <CategoryIcon
          name={category?.icon}
          size={16}
          color={category?.color ?? c.foreground}
        />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: c.foreground }]} numberOfLines={1}>
          {category?.name ?? formatDate(new Date(expense.occurred_at), 'PP')}
        </Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]} numberOfLines={1}>
          {expense.note?.trim()
            ? expense.note.trim()
            : formatDate(new Date(expense.occurred_at), 'PP')}
        </Text>
      </View>
      <Text style={[styles.amount, { color: c.foreground }]}>
        {formatCurrency(Number(expense.amount), expense.currency as CurrencyCode)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: Fonts.medium, fontSize: 15 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 13 },
  amount: { fontFamily: Fonts.semibold, fontSize: 15 },
});
