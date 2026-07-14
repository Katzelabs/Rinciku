import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from '@/lib/icons';

import { Radius, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/hooks/use-theme';

interface SettingsRowProps {
  /** Leading lucide icon. */
  icon: ComponentType<{ size?: number; color?: string }>;
  /** Medallion tint. Defaults to the brand primary. */
  tint?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  /** Draw a hairline top border — for rows after the first in a stacked card. */
  topBorder?: boolean;
}

/**
 * An iOS settings-list row: a tinted icon medallion + title / subtitle + a
 * trailing chevron. Used by the Manage landing to link into the dedicated
 * Essentials / Budgets / Categories screens; reusable for future settings rows.
 * Meant to sit inside a `Card padding={0}`.
 */
export function SettingsRow({
  icon: Icon,
  tint,
  title,
  subtitle,
  onPress,
  topBorder = false,
}: SettingsRowProps) {
  const c = useTheme();
  const tintColor = tint ?? c.primary;

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
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.medallion,
          { backgroundColor: withAlpha(tintColor, '22') },
        ]}
      >
        <Icon size={20} color={tintColor} />
      </View>
      <View style={styles.text}>
        <AppText variant='bodyMedium'>{title}</AppText>
        {subtitle ? (
          <AppText variant='caption' color='mutedForeground'>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <ChevronRight size={18} color={c.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  pressed: { opacity: 0.6 },
  medallion: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
});
