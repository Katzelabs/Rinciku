import { StyleSheet, Text } from 'react-native';

import { categoryEmoji } from '@rinciku/domain/categories';

interface CategoryIconProps {
  name: string | null | undefined;
  size?: number;
  /**
   * @deprecated Emoji are full-color and ignore this. Kept so existing call
   * sites that tinted the old lucide glyph still type-check.
   */
  color?: string;
}

/**
 * Renders a category's glyph as an emoji mapped from its stored lucide icon
 * name (see `categoryEmoji`). The data model still stores the lucide name — only
 * the presentation is an emoji, giving the friendlier full-color "chip" look
 * consistently across rows, medallions, the picker, and selects.
 */
export function CategoryIcon({ name, size = 20 }: CategoryIconProps) {
  return (
    <Text
      allowFontScaling={false}
      style={[styles.glyph, { fontSize: Math.round(size * 0.9), lineHeight: size }]}
    >
      {categoryEmoji(name)}
    </Text>
  );
}

const styles = StyleSheet.create({
  glyph: { textAlign: 'center' },
});
