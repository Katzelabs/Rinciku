import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Fonts, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';

const DEFAULT_SIZE = 36;

// Brown medallion for the avatar — a warm accent against the olive palette.
// Light glyphs sit on top, so it reads the same in light and dark mode.
const AVATAR_BG = '#6F4E37';
const AVATAR_FG = '#FBFBF9';

interface ProfileAvatarProps {
  onPress: () => void;
  accessibilityLabel: string;
  /** Diameter in px. Defaults to 30 (the dashboard header size). */
  size?: number;
}

// Circular avatar. There is no avatar image column, so we render the initials
// from the display name and fall back to a person symbol when it's empty. Used
// as the dashboard header's left action (opens Settings) and, at a larger size,
// in the settings hub summary header.
export function ProfileAvatar({
  onPress,
  accessibilityLabel,
  size = DEFAULT_SIZE,
}: ProfileAvatarProps) {
  const { profile } = useAuth();
  const initials = getInitials(profile?.display_name);

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View
        style={[
          styles.avatar,
          { width: size, height: size, backgroundColor: AVATAR_BG },
        ]}
      >
        {initials ? (
          <Text
            style={[
              styles.initials,
              { fontSize: Math.round(size * 0.42), color: AVATAR_FG },
            ]}
          >
            {initials}
          </Text>
        ) : (
          <Icon name='person.crop.circle' size={size} color={AVATAR_FG} />
        )}
      </View>
    </Pressable>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { fontFamily: Fonts.semibold },
});
