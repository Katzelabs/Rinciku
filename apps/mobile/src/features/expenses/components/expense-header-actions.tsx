import { Button, Host, HStack, Image } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, tint } from '@expo/ui/swift-ui/modifiers';
import { Camera, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { IconButton, Pill } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ExpenseHeaderActionsProps {
  onAdd: () => void;
  onCapture?: () => void;
}

// Expenses overview header actions: a prominent "Add" button (opens the
// new-expense form) and an upload/scan button for receipt capture. On iOS these
// are real native SwiftUI buttons (via @expo/ui) so they match the nav-bar
// chrome; Android falls back to styled Pressables (no SwiftUI bridge there).
export function ExpenseHeaderActions(props: ExpenseHeaderActionsProps) {
  if (Platform.OS === 'ios') {
    return <NativeActions {...props} />;
  }
  return <FallbackActions {...props} />;
}

function NativeActions({ onAdd, onCapture }: ExpenseHeaderActionsProps) {
  const c = useTheme();
  const { t } = useTranslation('common');

  return (
    <Host matchContents>
      <HStack spacing={Spacing.two}>
        <Button
          label={t('actions.add')}
          systemImage='plus'
          onPress={onAdd}
          modifiers={[
            buttonStyle('borderedProminent'),
            controlSize('small'),
            tint(c.primary),
          ]}
        />
        <Button
          onPress={onCapture}
          modifiers={[
            buttonStyle('bordered'),
            controlSize('small'),
            tint(c.primary),
          ]}
        >
          <Image systemName='camera' />
        </Button>
      </HStack>
    </Host>
  );
}

function FallbackActions({ onAdd, onCapture }: ExpenseHeaderActionsProps) {
  const c = useTheme();
  const { t } = useTranslation('common');

  return (
    <View style={styles.row}>
      <Pill
        tone='primary'
        label={t('actions.add')}
        leading={<Plus size={16} color={c.primaryForeground} />}
        onPress={onAdd}
        accessibilityLabel={t('nav.addExpense')}
      />
      <IconButton
        onPress={() => onCapture?.()}
        accessibilityLabel={t('nav.scanReceipt')}
      >
        <Camera size={18} color={c.foreground} />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
