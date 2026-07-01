import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/features/auth/components/button';
import { useTheme } from '@/hooks/use-theme';

// Centered empty state for list screens: a tinted icon medallion, a title, an
// optional subtitle, and an optional call-to-action button. Used for both the
// "no data yet" and "no filter results" cases (the caller picks the copy + CTA).
export function EmptyState({
  icon: IconComponent,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.medallion, { backgroundColor: c.muted }]}>
        <IconComponent size={30} color={c.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  medallion: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  title: { fontFamily: Fonts.semibold, fontSize: 17, textAlign: 'center' },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  action: { marginTop: Spacing.three, paddingHorizontal: Spacing.five },
});
