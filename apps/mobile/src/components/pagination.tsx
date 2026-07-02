import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Current page, 0-based. */
  page: number;
  /** Total number of pages (>= 1). */
  pageCount: number;
  onChange: (page: number) => void;
};

/**
 * Compact prev / "Page X of Y" / next pager. Renders nothing for a single page.
 * Uses the shared `common:table.*` strings so labels match the web table.
 */
export function Pagination({ page, pageCount, onChange }: Props) {
  const { t } = useTranslation('common');

  if (pageCount <= 1) return null;

  return (
    <View style={styles.row}>
      <NavButton
        icon={ChevronLeft}
        accessibilityLabel={t('table.previousPage')}
        disabled={page <= 0}
        onPress={() => onChange(page - 1)}
      />

      <AppText variant='label' color='mutedForeground'>
        {t('table.pageOf', { page: page + 1, count: pageCount })}
      </AppText>

      <NavButton
        icon={ChevronRight}
        accessibilityLabel={t('table.nextPage')}
        disabled={page >= pageCount - 1}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}

function NavButton({
  icon: Icon,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  icon: ComponentType<{ size?: number; color?: string }>;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.nav,
        { borderColor: c.border, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      <Icon size={18} color={c.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.two,
  },
  nav: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
    borderWidth: Border.hairline,
  },
});
