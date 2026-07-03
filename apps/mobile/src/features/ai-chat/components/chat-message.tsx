import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatItem } from '../types';

// One chat bubble. User messages hug the right on the brand lime; assistant
// replies hug the left on the muted surface. An attached receipt image (user
// messages only) renders as a thumbnail above the text bubble. Content is plain
// text for now — markdown rendering is a follow-up (see the mobile ai-chat plan).
export function ChatMessage({ item }: { item: ChatItem }) {
  const c = useTheme();
  const isUser = item.role === 'user';
  const hasText = item.content.trim().length > 0;
  return (
    <View style={[styles.row, isUser ? styles.rowEnd : styles.rowStart]}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={[styles.image, { backgroundColor: c.muted }]}
          contentFit='cover'
          transition={150}
        />
      ) : null}
      {hasText ? (
        <View
          style={[
            styles.bubble,
            isUser
              ? {
                  backgroundColor: c.primary,
                  borderBottomRightRadius: Radius.sm,
                }
              : { backgroundColor: c.muted, borderBottomLeftRadius: Radius.sm },
          ]}
        >
          <AppText
            selectable
            color={isUser ? 'primaryForeground' : 'foreground'}
          >
            {item.content}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    marginVertical: Spacing.one,
    gap: Spacing.one,
  },
  rowEnd: { alignItems: 'flex-end' },
  rowStart: { alignItems: 'flex-start' },
  image: {
    width: '66%',
    height: 200,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
  },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
  },
});
