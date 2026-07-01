import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PRESET_COLORS } from '@/features/categories/types';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

// Preset swatches + a free-form #RRGGBB field, mirroring the web ColorPicker.
export function ColorPicker({ value, onChange, invalid }: ColorPickerProps) {
  const c = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.swatches}>
        {PRESET_COLORS.map((hex) => {
          const selected = hex.toLowerCase() === value.toLowerCase();
          return (
            <Pressable
              key={hex}
              onPress={() => onChange(hex)}
              accessibilityRole='button'
              accessibilityState={{ selected }}
              style={[
                styles.swatch,
                {
                  backgroundColor: hex,
                  borderColor: selected ? c.ring : 'transparent',
                },
              ]}
            />
          );
        })}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder='#RRGGBB'
        placeholderTextColor={c.mutedForeground}
        autoCapitalize='none'
        autoCorrect={false}
        maxLength={7}
        style={[
          styles.input,
          {
            color: c.foreground,
            backgroundColor: c.card,
            borderColor: invalid ? c.destructive : c.input,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: 3,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontFamily: Fonts.mono,
    fontSize: 15,
  },
});
