import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SegmentedOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (key: T) => void;
}

// A fully-rounded pill segmented control. The active segment fills with the
// brand primary (lime/green); inactive segments read as muted labels on the
// track. Pure RN so it needs no native module — used to switch sub-sections in
// the Manage tab.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const c = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: c.muted }]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole='button'
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.key)}
            style={({ pressed }) => [
              styles.segment,
              active && { backgroundColor: c.primary },
              { opacity: pressed && !active ? 0.6 : 1 },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: active ? c.primaryForeground : c.mutedForeground },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: Spacing.half,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
    gap: Spacing.half,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
  },
  label: { fontFamily: Fonts.semibold, fontSize: 14 },
});
