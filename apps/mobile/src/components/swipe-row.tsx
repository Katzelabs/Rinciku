import { type ReactNode, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Trash2 } from 'lucide-react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SwipeRowProps {
  /** Tap the row body (e.g. open the edit sheet). */
  onPress: () => void;
  /** Optional long-press on the row body — for a contextual action (e.g. rename)
   * that stays off the row so it isn't a trailing icon button. */
  onLongPress?: () => void;
  /** Fired when the revealed delete action is tapped. Route it through your own
   * confirmation (Alert) — SwipeRow just closes itself first. */
  onDelete: () => void;
  /** Accessibility label for the delete action. */
  deleteLabel: string;
  children: ReactNode;
  /** Draw a hairline top border — for rows after the first in a stacked card. */
  topBorder?: boolean;
}

/**
 * A list row with swipe-left-to-delete and tap-to-edit, built on
 * gesture-handler's `ReanimatedSwipeable`. Centralizes the gesture so the
 * essentials + categories managers share one row affordance instead of each
 * cramming two trailing icon buttons.
 *
 * The row body carries a solid `card` background and owns its horizontal
 * padding so it sits full-bleed over the red action; put it inside a
 * `Card padding={0} style={{ overflow: 'hidden' }}` so the action is clipped to
 * the card's rounded corners.
 */
export function SwipeRow({
  onPress,
  onLongPress,
  onDelete,
  deleteLabel,
  children,
  topBorder = false,
}: SwipeRowProps) {
  const c = useTheme();
  const ref = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={deleteLabel}
          onPress={() => {
            ref.current?.close();
            onDelete();
          }}
          style={[styles.deleteAction, { backgroundColor: c.destructive }]}
        >
          <Trash2 size={20} color={c.destructiveForeground} />
        </Pressable>
      )}
    >
      <Pressable
        accessibilityRole='button'
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.body,
          { backgroundColor: c.card },
          topBorder && {
            borderTopColor: c.border,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  pressed: { opacity: 0.6 },
  deleteAction: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
