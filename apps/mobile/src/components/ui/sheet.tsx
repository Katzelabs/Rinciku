import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppText } from './text';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Optional actions rendered left of the close button (e.g. a "Clear" link). */
  headerRight?: ReactNode;
  children: ReactNode;
  /** Wrap the body in a ScrollView (default). Set false for self-scrolling bodies. */
  scroll?: boolean;
}

/**
 * The standard page-sheet modal — the `sheet`/`sheetHeader`/`sheetTitle`/
 * close-X chrome that was re-implemented in ~11 files. Consistent header,
 * close affordance, and safe-area bottom padding.
 */
export function Sheet({
  visible,
  onClose,
  title,
  headerRight,
  children,
  scroll = true,
}: SheetProps) {
  const c = useTheme();
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={[
        styles.body,
        { paddingBottom: insets.bottom + Spacing.five },
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, styles.bodyFlex]}>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.sheet, { backgroundColor: c.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <AppText variant='sheetTitle'>{title}</AppText>
          <View style={styles.headerActions}>
            {headerRight}
            <Pressable
              hitSlop={8}
              accessibilityRole='button'
              accessibilityLabel={t('actions.close')}
              onPress={onClose}
            >
              <X size={22} color={c.mutedForeground} />
            </Pressable>
          </View>
        </View>
        {body}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  bodyFlex: { flex: 1 },
});
