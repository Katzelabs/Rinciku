import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { ChatItem } from '../types';
import type { UseChatResult } from '../hooks/use-chat';
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
export function ChatThread({ chat }: { chat: UseChatResult }) {
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

  return (
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
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: Spacing.three },
  extras: { gap: Spacing.two },
  card: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
});
