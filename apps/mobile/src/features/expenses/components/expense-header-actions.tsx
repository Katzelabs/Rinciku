import { Button, Host, HStack, Image } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, tint } from '@expo/ui/swift-ui/modifiers';
import { Camera, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
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
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={t('nav.addExpense')}
        onPress={onAdd}
        style={({ pressed }) => [
          styles.addPill,
          { backgroundColor: c.primary, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Plus size={16} color={c.foreground} />
        <Text style={[styles.addLabel, { color: c.foreground }]}>
          {t('actions.add')}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole='button'
        accessibilityLabel={t('nav.scanReceipt')}
        onPress={onCapture}
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: c.muted, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Camera size={18} color={c.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.three,
    height: 34,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
  },
  addLabel: { fontFamily: Fonts.semibold, fontSize: 15 },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
  },
});
