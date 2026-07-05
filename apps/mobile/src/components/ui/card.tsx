import { StyleSheet, View, type ViewProps } from 'react-native';

import { CardStyle, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CardProps extends ViewProps {
  /**
   * Uniform padding. Defaults to the standard card padding. Pass `0` for
   * row-list cards (the rows own their vertical padding) and add
   * `paddingHorizontal` via `style`.
   */
  padding?: number;
  /** Corner radius. Defaults to the standard card radius. */
  radius?: number;
}

/**
 * The standard content surface — the hairline-bordered rounded card that was
 * copy-pasted into ~25 files. One radius + one border width, olive `card`/
 * `border` tokens, continuous corners.
 */
export function Card({
  padding = CardStyle.padding,
  radius = CardStyle.radius,
  style,
  ...rest
}: CardProps) {
  const c = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderRadius: radius,
          padding,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Full-width hairline rule in the `border` token — for splitting card rows. */
export function Divider() {
  const c = useTheme();
  return <View style={[styles.divider, { backgroundColor: c.border }]} />;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: CardStyle.borderWidth,
    borderCurve: 'continuous',
    // Soft elevation so white cards read as raised objects against the warm
    // ground. Renders on light; effectively invisible on the dark scheme, where
    // the card/background contrast already does the work.
    boxShadow: Shadow.sm,
  },
  divider: { height: StyleSheet.hairlineWidth },
});
