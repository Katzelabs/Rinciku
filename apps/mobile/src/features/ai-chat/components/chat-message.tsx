import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatItem } from '../types';
import { AssistantMarker } from './assistant-marker';
import { CopyButton } from './copy-button';
import { Markdown } from './markdown';

// One chat turn. Assistant replies render bubble-less — markdown-formatted text
// straight on the background (the Claude-app reading layout) — while user
// messages hug the right in a solid primary (lime) bubble with contrasting
// `primaryForeground` ink. An attached receipt image (user messages only)
// renders as a thumbnail above the bubble.
//
// Memoized: the inverted list re-renders its data array on every turn, but a
// given row's `item` is stable, so `memo` keeps already-rendered turns from
// re-running their markdown parse on each new message.
export const ChatMessage = memo(function ChatMessage({
  item,
}: {
  item: ChatItem;
}) {
  const c = useTheme();
  const isUser = item.role === 'user';
  const hasText = item.content.trim().length > 0;

  if (!isUser) {
    // Assistant: full-width, left-aligned, no bubble. The shared identity marker
    // sits above the markdown so AI turns are instantly distinguishable from the
    // right-hugging user bubbles, with the copy affordance tucked underneath the
    // reply (the ChatGPT/Claude reading layout).
    return (
      <View style={styles.assistant}>
        <AssistantMarker />
        {hasText ? <Markdown content={item.content} /> : null}
        {hasText ? (
          <View style={styles.actions}>
            <CopyButton value={item.content} />
          </View>
        ) : null}
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
              backgroundColor: c.primary,
              borderBottomRightRadius: Radius.sm,
            },
          ]}
        >
          <AppText selectable color='primaryForeground'>
            {item.content}
          </AppText>
        </View>
      ) : null}
    </View>
  );
});

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
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    // Pull the button's own horizontal padding back so the copy icon lines up
    // with the left edge of the reply text.
    marginLeft: -Spacing.one,
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
