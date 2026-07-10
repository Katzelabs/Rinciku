import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { headerIcon } from '@/lib/header-icons';
import { deleteConversation, touchConversation } from '@/features/ai-chat/api';
import {
  patchConversationInCache,
  removeConversationFromCache,
} from '@/features/ai-chat/lib/conversation-cache';
import { ChatThread } from '@/features/ai-chat/components/chat-thread';
import { ConversationList } from '@/features/ai-chat/components/conversation-list';
import { MessageComposer } from '@/features/ai-chat/components/message-composer';
import { WelcomeScreen } from '@/features/ai-chat/components/welcome-screen';
import { useChat } from '@/features/ai-chat/hooks/use-chat';
import { useConversations } from '@/features/ai-chat/hooks/use-conversations';
import { Notice } from '@/features/auth/components/notice';
import { useTheme } from '@/hooks/use-theme';

// The AI chat tab: budget-grounded consultation + expense/income/change
// proposal cards, plus multi-conversation management (history sheet, new chat,
// rename, delete). The agentic loop and data layer live in the shared
// @rinciku/domain/ai-chat slice; this screen owns the native chrome only.
export default function AiScreen() {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const conversations = useConversations();
  // The hook patches the cached history list directly after every turn (new or
  // bumped conversations surface without a refetch); mobile has no URL to sync,
  // so no onConversationCreated either.
  const chat = useChat();
  const [historyOpen, setHistoryOpen] = useState(false);

  // Clearance so content clears the header. The message list draws under the
  // floating header items, so we inset content by the header bar height (~52)
  // plus the safe-area top.
  const headerClearance = insets.top + 52;

  const showWelcome =
    chat.messages.length === 0 &&
    !chat.sending &&
    !chat.proposal &&
    !chat.pendingChange &&
    !chat.isLoading;

  function handleSelect(id: string) {
    chat.selectConversation(id);
    setHistoryOpen(false);
  }

  async function handleRename(id: string, title: string) {
    const { error } = await touchConversation(id, { title });
    if (error) {
      Alert.alert(t('toast.renameError'));
      return;
    }
    patchConversationInCache(queryClient, id, { title });
  }

  function handleDelete(id: string) {
    Alert.alert(t('delete.title'), t('delete.description'), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('common:actions.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteConversation(id);
          if (error) {
            Alert.alert(t('toast.deleteError'));
            return;
          }
          // If the open thread was deleted, drop back to a fresh chat.
          if (id === chat.activeId) chat.startNew();
          removeConversationFromCache(queryClient, id);
        },
      },
    ]);
  }

  return (
    <Screen>
      {/* Immersive full-screen chat (the native tab bar is hidden for this tab
          via the (app) layout). Header: a "home" button on the left returns to
          the tabbed app; the chat-list + prominent "new chat" actions are
          grouped on the right. The header is transparent (floating glass
          buttons); the message list content is inset by `headerClearance` so the
          turns rest below the buttons. */}
      <Stack.Screen
        options={{
          headerTitle: '',
          unstable_headerLeftItems: () => [
            {
              label: t('common:nav.items.home'),
              accessibilityLabel: t('common:nav.items.home'),
              type: 'button',
              icon: headerIcon.home,
              onPress: () => router.navigate('/(app)/(dashboard)'),
            },
          ],
          unstable_headerRightItems: () => [
            {
              label: t('header.openHistory'),
              accessibilityLabel: t('header.openHistory'),
              type: 'button',
              icon: headerIcon.history,
              onPress: () => setHistoryOpen(true),
            },
            {
              label: t('header.newChat'),
              accessibilityLabel: t('header.newChat'),
              type: 'button',
              icon: headerIcon.add,
              onPress: chat.startNew,
            },
          ],
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // The KeyboardAvoidingView fills the whole screen (transparent header,
        // hidden tab bar), so its bottom edge sits at the screen bottom. For
        // `behavior='padding'` that means the inserted padding already equals the
        // keyboard height — any positive offset here just floats the composer
        // that many px ABOVE the keyboard. Keep it at 0 so the input rests flush.
        keyboardVerticalOffset={0}
      >
        {chat.error ? (
          <View style={[styles.notice]}>
            <Notice tone='error'>{chat.error}</Notice>
          </View>
        ) : null}

        {chat.isLoading ? (
          <View style={[styles.center]}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : showWelcome ? (
          <WelcomeScreen onPick={chat.send} topInset={headerClearance} />
        ) : (
          <ChatThread chat={chat} topInset={headerClearance} />
        )}

        <MessageComposer
          onSend={chat.send}
          onSendImage={chat.sendImage}
          disabled={chat.sending}
        />
      </KeyboardAvoidingView>

      <ConversationList
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        conversations={conversations.data}
        isLoading={conversations.isLoading}
        activeId={chat.activeId}
        onSelect={handleSelect}
        onRename={handleRename}
        onDelete={handleDelete}
        hasNextPage={conversations.hasNextPage}
        isFetchingNextPage={conversations.isFetchingNextPage}
        onLoadMore={conversations.fetchNextPage}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notice: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
});
