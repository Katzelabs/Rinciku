import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AuthScreenShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// Shared scaffold for the auth screens: keyboard-avoiding scroll view, safe-area
// aware (the navigator header + `contentInsetAdjustmentBehavior` handle insets),
// centered max-width column, title/description header, and an optional footer.
export function AuthScreenShell({
  title,
  description,
  children,
  footer,
}: AuthScreenShellProps) {
  const c = useTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior='automatic'
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={styles.content}
      >
        <View style={styles.column}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
            {description ? (
              <Text style={[styles.description, { color: c.mutedForeground }]}>
                {description}
              </Text>
            ) : null}
          </View>
          {children}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  header: { gap: Spacing.two },
  title: { fontFamily: Fonts.bold, fontSize: 28 },
  description: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
  footer: { marginTop: Spacing.two, gap: Spacing.three },
});
