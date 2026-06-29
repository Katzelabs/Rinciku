import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Icon, type IconName } from '@/components/icon';
import { LogoMark } from '@/components/logo-mark';
import { useTheme } from '@/hooks/use-theme';

interface BrandHeaderProps {
  title: string;
  description?: string;
  /**
   * When set, a circular tinted badge with this icon replaces the brand
   * lockup — used for contextual states like "check your email" / errors.
   */
  badge?: IconName;
  /** Hide the brand lockup (e.g. when a badge is shown). Defaults to showing it. */
  showBrand?: boolean;
}

// TODO(user logo): to use a supplied logo image instead of the code-built mark,
// drop `assets/images/logo.png` (+ optional `logo-dark.png`) in and swap
// <LogoMark /> for an <Image> here.

// Centered brand + title/description block at the top of every auth screen.
export function BrandHeader({
  title,
  description,
  badge,
  showBrand = true,
}: BrandHeaderProps) {
  const c = useTheme();

  return (
    <View style={styles.container}>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: c.muted }]}>
          <Icon name={badge} size={26} color={c.primary} />
        </View>
      ) : showBrand ? (
        <View style={styles.lockup}>
          <LogoMark size={44} />
          <Text style={[styles.wordmark, { color: c.foreground }]}>Rinciku</Text>
        </View>
      ) : null}

      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: c.mutedForeground }]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.two },
  lockup: { alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.one },
  wordmark: { fontFamily: Fonts.bold, fontSize: 18, letterSpacing: -0.3 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  title: { fontFamily: Fonts.bold, fontSize: 28, textAlign: 'center' },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
});
