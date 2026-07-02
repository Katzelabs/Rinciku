import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { AppText } from './text';

interface SectionHeaderProps {
  title: string;
  /**
   * `title` — bold 22px screen section heading (e.g. "Recent activity").
   * `overline` — uppercase 12px label for day-groups / grouped lists.
   */
  variant?: 'title' | 'overline';
  /** Trailing content: a "See all" link, a subtotal, an action, etc. */
  right?: ReactNode;
}

/**
 * Unifies the three previously-forked section-heading looks (22 bold / 18 bold /
 * 12 uppercase) behind two named variants.
 */
export function SectionHeader({
  title,
  variant = 'title',
  right,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, variant === 'overline' && styles.overlineRow]}>
      <AppText
        variant={variant === 'title' ? 'title' : 'overline'}
        color={variant === 'overline' ? 'mutedForeground' : 'foreground'}
      >
        {title}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlineRow: { paddingHorizontal: Spacing.one },
});
