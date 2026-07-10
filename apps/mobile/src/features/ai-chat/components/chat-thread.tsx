import { LegendList, type LegendListRef } from '@legendapp/list/react-native';
import { ChevronDown } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Border, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UseChatResult } from '../hooks/use-chat';
import type { ChatItem } from '../types';
import { ActionProposalCard } from './action-proposal-card';
import { ChatMessage } from './chat-message';
import { ExpenseProposalCard } from './expense-proposal-card';
import { IncomeProposalCard } from './income-proposal-card';
import { TypingIndicator } from './typing-indicator';

// Show the scroll-to-latest affordance once the newest turn is roughly a
// screenful below the viewport (distance from the list's end).
const SCROLL_DOWN_THRESHOLD = 240;

// Stable list callbacks so rows don't re-create their render closure each turn
// (paired with the `memo`'d ChatMessage).
const keyExtractor = (item: ChatItem) => item.id;
const renderItem = ({ item }: { item: ChatItem }) => (
  <ChatMessage item={item} />
);

// The message list. Rendered upright (newest at the bottom) with LegendList's
// chat mode — `alignItemsAtEnd` pins a short conversation to the bottom and
// `maintainScrollAtEnd` keeps the view stuck to the newest turn as messages
// arrive. We deliberately avoid an inverted FlatList: the `scaleY: -1` flip it
// relies on renders a faint overlay artifact on the New Architecture. The live
// turn extras (typing indicator + active confirmation card) sit in the list
// footer, which renders just below the most recent message.
export function ChatThread({
  chat,
  topInset = 0,
}: {
  chat: UseChatResult;
  /** Clearance so the oldest turn / resting scroll position clears the floating
   * header instead of starting under it. This is the content's *top* padding. */
  topInset?: number;
}) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const listRef = useRef<LegendListRef>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromEnd =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    const next = distanceFromEnd > SCROLL_DOWN_THRESHOLD;
    setShowScrollDown((prev) => (prev === next ? prev : next));
  }

  const scrollToLatest = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Spinner row above the oldest loaded message while an older page loads.
  const header = chat.isLoadingOlder ? (
    <View style={styles.olderSpinner}>
      <ActivityIndicator color={c.mutedForeground} />
    </View>
  ) : null;

  const footer = (
    <View style={styles.extras}>
      {chat.sending ? <TypingIndicator /> : null}
      {chat.proposal ? (
        <View style={styles.card}>
          {chat.proposal.proposal.kind === 'income' ? (
            <IncomeProposalCard
              proposal={chat.proposal.proposal}
              attachment={chat.proposal.attachment}
              onConfirmed={chat.noteConfirmation}
              onCancel={chat.dismissProposal}
            />
          ) : (
            <ExpenseProposalCard
              proposal={chat.proposal.proposal}
              attachment={chat.proposal.attachment}
              onConfirmed={chat.noteConfirmation}
              onCancel={chat.dismissProposal}
            />
          )}
        </View>
      ) : null}
      {chat.pendingChange ? (
        <View style={styles.card}>
          <ActionProposalCard
            change={chat.pendingChange}
            confirming={chat.confirmingChange}
            onConfirm={chat.confirmChange}
            onCancel={chat.dismissChange}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.list}>
      <LegendList
        ref={listRef}
        data={chat.messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={80}
        recycleItems={false}
        alignItemsAtEnd
        maintainScrollAtEnd
        // Scroll-up pagination: the list is upright (oldest at the top), so
        // nearing the START loads the next OLDER page; keeping the visible
        // content anchored prevents a jump when the page prepends.
        onStartReached={chat.loadOlderMessages}
        onStartReachedThreshold={0.2}
        maintainVisibleContentPosition
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={{
          paddingTop: topInset,
          paddingBottom: Spacing.five,
        }}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='interactive'
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
      />
      {showScrollDown ? (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={t('message.scrollToLatest')}
          onPress={scrollToLatest}
          style={({ pressed }) => [
            styles.scrollDown,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ChevronDown size={22} color={c.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Fill the full height between the header and the composer.
  list: {
    flex: 1,
  },
  extras: { gap: Spacing.two, paddingTop: Spacing.two },
  olderSpinner: { paddingVertical: Spacing.three, alignItems: 'center' },
  card: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  // Floating pill just above the composer; taps jump back to the newest turn.
  scrollDown: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: Border.hairline,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: Shadow.md,
  },
});
