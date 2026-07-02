import { Stack } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { Notice } from '@/features/auth/components/notice';
import { ChatThread } from '@/features/ai-chat/components/chat-thread';
import { MessageComposer } from '@/features/ai-chat/components/message-composer';
import { WelcomeScreen } from '@/features/ai-chat/components/welcome-screen';
import { useChat } from '@/features/ai-chat/hooks/use-chat';
import { useTheme } from '@/hooks/use-theme';

// The AI chat tab: budget-grounded consultation + expense/income/change
// proposal cards. The agentic loop and data layer live in the shared
// @rinciku/domain/ai-chat slice; this screen owns the native chrome only.
export default function AiScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const chat = useChat();

  const showWelcome =
    chat.messages.length === 0 &&
    !chat.sending &&
    !chat.proposal &&
    !chat.pendingChange &&
    !chat.isLoading;

  return (
    <Screen>
      {/* Standard (non-large) header so the keyboard offset is predictable. */}
      <Stack.Screen options={{ headerLargeTitle: false }} />
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

        <MessageComposer onSend={chat.send} disabled={chat.sending} />
      </KeyboardAvoidingView>
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
