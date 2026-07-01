import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius } from '@/constants/theme';
import { Icon } from '@/components/icon';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 30;

interface ProfileAvatarProps {
  onPress: () => void;
  accessibilityLabel: string;
}

// Circular header avatar. There is no avatar image column, so we render the
// initials from the display name and fall back to a person symbol when it's
// empty. Used as the dashboard header's left action (opens Settings).
export function ProfileAvatar({
  onPress,
  accessibilityLabel,
}: ProfileAvatarProps) {
  const c = useTheme();
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
      <View style={[styles.avatar, { backgroundColor: c.card }]}>
        {initials ? (
          <Text style={[styles.initials, { color: c.foreground }]}>
            {initials}
          </Text>
        ) : (
          <Icon
            name='person.crop.circle'
            size={SIZE}
            color={c.mutedForeground}
          />
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
    width: SIZE,
    height: SIZE,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { fontFamily: Fonts.semibold, fontSize: 13 },
});
