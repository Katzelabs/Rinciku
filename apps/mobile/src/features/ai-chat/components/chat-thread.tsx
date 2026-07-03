import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { UseChatResult } from '../hooks/use-chat';
import type { ChatItem } from '../types';
import { ActionProposalCard } from './action-proposal-card';
import { ChatMessage } from './chat-message';
import { ExpenseProposalCard } from './expense-proposal-card';
import { IncomeProposalCard } from './income-proposal-card';
import { TypingIndicator } from './typing-indicator';

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
  // Inverted list wants newest-first data.
  const data = useMemo(() => [...chat.messages].reverse(), [chat.messages]);

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
    <View style={[styles.list, { paddingTop: topInset }]}>
      <FlatList
        data={data}
        inverted
        keyExtractor={(item: ChatItem) => item.id}
        renderItem={({ item }) => <ChatMessage item={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='interactive'
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Fill the full height between the header and the composer.
  list: { flex: 1 },
  // Grow to full height so a short conversation still anchors to the bottom
  // (inverted list). Padding gives the bubbles breathing room from both chrome
  // edges: paddingTop is the visual bottom (space above the composer input),
  // paddingBottom is the visual top (space below the header).
  content: {
    flexGrow: 1,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  extras: { gap: Spacing.two },
  card: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
});
