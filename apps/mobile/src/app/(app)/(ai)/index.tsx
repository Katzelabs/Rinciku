import { Stack } from 'expo-router';
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
import { List, Plus } from 'lucide-react-native';

import { HeaderAction } from '@/components/header-action';
import { Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { Notice } from '@/features/auth/components/notice';
import { deleteConversation, touchConversation } from '@/features/ai-chat/api';
import { ChatThread } from '@/features/ai-chat/components/chat-thread';
import { ConversationList } from '@/features/ai-chat/components/conversation-list';
import { MessageComposer } from '@/features/ai-chat/components/message-composer';
import { WelcomeScreen } from '@/features/ai-chat/components/welcome-screen';
import { useChat } from '@/features/ai-chat/hooks/use-chat';
import { useConversations } from '@/features/ai-chat/hooks/use-conversations';
import { useTheme } from '@/hooks/use-theme';

// The AI chat tab: budget-grounded consultation + expense/income/change
// proposal cards, plus multi-conversation management (history sheet, new chat,
// rename, delete). The agentic loop and data layer live in the shared
// @rinciku/domain/ai-chat slice; this screen owns the native chrome only.
export default function AiScreen() {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const insets = useSafeAreaInsets();
  const conversations = useConversations();
  const chat = useChat({
    // Re-sort/refresh the history list after every turn so a new or bumped
    // conversation surfaces. Mobile has no URL, so onConversationCreated just
    // refreshes too (activeId is already set inside the hook).
    onConversationsChanged: conversations.refetch,
    onConversationCreated: () => conversations.refetch(),
  });
  const [historyOpen, setHistoryOpen] = useState(false);

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
    conversations.refetch();
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
          conversations.refetch();
        },
      },
    ]);
  }

  return (
    <Screen>
      {/* Standard (non-large) header so the keyboard offset is predictable. */}
      <Stack.Screen
        options={{
          headerLargeTitle: false,
          headerRight: () => (
            <View style={styles.headerActions}>
              <HeaderAction
                onPress={() => setHistoryOpen(true)}
                accessibilityLabel={t('header.openHistory')}
                systemImage='list.bullet'
                icon={List}
              />
              <HeaderAction
                onPress={chat.startNew}
                accessibilityLabel={t('header.newChat')}
                systemImage='plus'
                icon={Plus}
              />
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
      >
        {chat.error ? (
          <View style={styles.notice}>
            <Notice tone='error'>{chat.error}</Notice>
          </View>
        ) : null}

        {chat.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : showWelcome ? (
          <WelcomeScreen onPick={chat.send} />
        ) : (
          <ChatThread chat={chat} />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
