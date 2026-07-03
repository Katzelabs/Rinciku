import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { ChatItem } from '../types';
import { Markdown } from './markdown';

// One chat turn. Assistant replies render bubble-less — markdown-formatted text
// straight on the background (the Claude-app reading layout) — while user
// messages hug the right in a soft-lime bubble (the brand primary, tinted down
// so it reads calmly against the background). An attached receipt image (user
// messages only) renders as a thumbnail above the bubble.
export function ChatMessage({ item }: { item: ChatItem }) {
  const c = useTheme();
  const isUser = item.role === 'user';
  const hasText = item.content.trim().length > 0;

  if (!isUser) {
    // Assistant: full-width, left-aligned, no bubble.
    return (
      <View style={styles.assistant}>
        {hasText ? <Markdown content={item.content} /> : null}
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.rowEnd]}>
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
            {
              backgroundColor: withAlpha(c.primary, '2E'),
              borderBottomRightRadius: Radius.sm,
            },
          ]}
        >
          <AppText selectable color='foreground'>
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
  assistant: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    marginVertical: Spacing.two,
  },
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
