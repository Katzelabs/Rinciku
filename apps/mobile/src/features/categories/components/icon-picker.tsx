import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_ICONS } from '@/features/categories/types';
import { CategoryIcon } from './category-icon';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

// Inline grid of the curated category icons. Lives inside the category form
// modal, so no popover — the selected icon gets a ring border + muted fill.
export function IconPicker({ value, onChange, invalid }: IconPickerProps) {
  const c = useTheme();
  return (
    <View
      style={[styles.grid, { borderColor: invalid ? c.destructive : c.border }]}
    >
      {CATEGORY_ICONS.map((name) => {
        const selected = name === value;
        return (
          <Pressable
            key={name}
            onPress={() => onChange(name)}
            accessibilityRole='button'
            accessibilityState={{ selected }}
            style={[
              styles.cell,
              { borderColor: selected ? c.ring : 'transparent' },
              selected ? { backgroundColor: c.muted } : null,
            ]}
          >
            <CategoryIcon
              name={name}
              size={20}
              color={selected ? c.foreground : c.mutedForeground}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    padding: Spacing.two,
  },
  cell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
});
