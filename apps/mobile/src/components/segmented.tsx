import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Host, Picker, Text as SwiftText } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

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

/**
 * Adaptive segmented control. iOS renders a real native SwiftUI segmented
 * `Picker` (via `@expo/ui/swift-ui`) so it matches platform chrome; Android
 * renders the custom fully-rounded pill track. Both share one option/value/
 * onChange contract, so callers never branch.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  if (Platform.OS === 'ios') {
    return (
      <Host matchContents={{ vertical: true }} style={styles.host}>
        <Picker
          selection={value}
          onSelectionChange={(v) => onChange(v as T)}
          modifiers={[pickerStyle('segmented')]}
        >
          {options.map((o) => (
            <SwiftText key={o.key} modifiers={[tag(o.key)]}>
              {o.label}
            </SwiftText>
          ))}
        </Picker>
      </Host>
    );
  }

  return <RNSegmented options={options} value={value} onChange={onChange} />;
}

function RNSegmented<T extends string>({
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
  host: { width: '100%' },
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
