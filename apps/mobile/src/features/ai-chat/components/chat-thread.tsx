import { ChevronDown } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
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

// Show the scroll-to-latest affordance once the user has scrolled roughly a
// screenful up from the newest turn (offset 0 on the inverted list).
const SCROLL_DOWN_THRESHOLD = 240;

// The message list. Rendered inverted so new content sticks to the bottom and
// the keyboard pushes the latest turn into view without manual scrolling. The
// live turn extras (typing indicator + the active confirmation card) sit in the
// list header, which — because the list is inverted — renders just below the
// most recent message.
export function ChatThread({
  chat,
  topInset = 0,
}: {
  chat: UseChatResult;
  /** Clearance so the newest turn clears the header instead of scrolling under
   * it. On the inverted list this is the content's *bottom* padding. */
  topInset?: number;
}) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const listRef = useRef<FlatList<ChatItem>>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Inverted list wants newest-first data.
  const data = useMemo(() => [...chat.messages].reverse(), [chat.messages]);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = e.nativeEvent.contentOffset.y > SCROLL_DOWN_THRESHOLD;
    setShowScrollDown((prev) => (prev === next ? prev : next));
  }

  // Newest turn sits at offset 0 on the inverted list.
  function scrollToLatest() {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  const header = (
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

  // Inset the *list frame* (not just the scroll content) below the header, so
  // messages clip at the header's bottom edge instead of scrolling under the
  // transparent header — the same reason the (non-scrolling) welcome screen
  // never bleeds. Without this, `style={{ flex: 1 }}` fills the whole screen
  // beneath the header and content shows through it while scrolling.
  return (
    <View style={[styles.list]}>
      <FlatList
        ref={listRef}
        data={data}
        inverted
        keyExtractor={(item: ChatItem) => item.id}
        renderItem={({ item }) => <ChatMessage item={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.content, { paddingBottom: topInset }]}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='interactive'
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={64}
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
  // Grow to full height so a short conversation still anchors to the bottom
  // (inverted list). Padding gives the bubbles breathing room from both chrome
  // edges: paddingTop is the visual bottom (space above the composer input),
  // paddingBottom is the visual top (space below the header).
  content: {
    flexGrow: 1,
    paddingTop: Spacing.five,
  },
  extras: { gap: Spacing.two },
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
