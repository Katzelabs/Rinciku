import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Sparkles } from 'lucide-react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatItem } from '../types';
import { Markdown } from './markdown';

// One chat turn. Assistant replies render bubble-less — markdown-formatted text
// straight on the background (the Claude-app reading layout) — while user
// messages hug the right in a solid primary (lime) bubble with contrasting
// `primaryForeground` ink. An attached receipt image (user messages only)
// renders as a thumbnail above the bubble.
export function ChatMessage({ item }: { item: ChatItem }) {
  const c = useTheme();
  const isUser = item.role === 'user';
  const hasText = item.content.trim().length > 0;

  if (!isUser) {
    // Assistant: full-width, left-aligned, no bubble. A compact identity marker
    // (sparkle badge + brand name) sits above the markdown so AI turns are
    // instantly distinguishable from the right-hugging user bubbles.
    return (
      <View style={styles.assistant}>
        <View style={styles.aiMarker}>
          <View style={[styles.aiBadge, { backgroundColor: c.muted }]}>
            <Sparkles size={12} color={c.primary} />
          </View>
          <AppText variant='overline' color='mutedForeground'>
            Rinciku
          </AppText>
        </View>
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
    gap: Spacing.one,
  },
  aiMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  aiBadge: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
