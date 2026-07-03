import { Image } from 'expo-image';
import { ArrowUp, ImagePlus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionSheetIOS,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pickImage, type PickedImage, type PickSource } from '../lib/image';

// Bottom composer bar: a growing multiline input + attach + send. The attach
// button opens a native chooser (Take Photo / Choose from Library); a picked
// receipt is staged as a preview chip, then sent as an image turn that forces
// the model to propose a transaction. Enter inserts a newline (native multiline
// default); sending is via the button, matching the mobile keyboard idiom.
export function MessageComposer({
  onSend,
  onSendImage,
  disabled = false,
}: {
  onSend: (text: string) => void;
  onSendImage: (asset: PickedImage, caption?: string) => void;
  disabled?: boolean;
}) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [staged, setStaged] = useState<PickedImage | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const canSend = !disabled && (staged !== null || text.trim().length > 0);

  // The AI screen hides the tab bar, so when the keyboard is closed we only
  // need to clear the bottom safe area (home indicator). When it's open the
  // KeyboardAvoidingView already lifts the composer, so collapse the padding to
  // avoid a gap above the keyboard.
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const paddingBottom = keyboardVisible
    ? Spacing.two
    : Math.max(insets.bottom, Spacing.two);

  function handleSend() {
    if (!canSend) return;
    if (staged) {
      onSendImage(staged, text.trim() || undefined);
      setStaged(null);
      setText('');
      return;
    }
    onSend(text.trim());
    setText('');
  }

  async function openPicker(source: PickSource) {
    const outcome = await pickImage(source);
    if (outcome.ok) {
      setStaged(outcome.asset);
      return;
    }
    if (outcome.reason === 'cancelled') return;
    const message =
      outcome.reason === 'permission'
        ? t('composer.permissionDenied')
        : outcome.reason === 'tooLarge'
          ? t('composer.imageTooLarge')
          : t('composer.invalidImage');
    Alert.alert(message);
  }

  function promptAttach() {
    if (disabled) return;
    const take = t('composer.takePhoto');
    const library = t('composer.chooseFromLibrary');
    const cancel = t('common:actions.cancel');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [take, library, cancel], cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) void openPicker('camera');
          else if (index === 1) void openPicker('library');
        }
      );
    } else {
      Alert.alert(t('composer.attachImage'), undefined, [
        { text: take, onPress: () => void openPicker('camera') },
        { text: library, onPress: () => void openPicker('library') },
        { text: cancel, style: 'cancel' },
      ]);
    }
  }

  return (
    <View style={[styles.bar, { paddingBottom }]}>
      {/* Transparent bar — no full-width strip. Only the rounded shell below is
          visible, floating directly on the chat background. */}
      {/* One rounded shell holds the staged preview, the growing input, and the
          attach + send controls — the unified composer surface. */}
      <View
        style={[
          styles.shell,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        {staged ? (
          <View style={styles.previewChip}>
            <Image
              source={{ uri: staged.uri }}
              style={[styles.previewImage, { backgroundColor: c.muted }]}
              contentFit='cover'
            />
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={t('composer.removeImage')}
              onPress={() => setStaged(null)}
              style={({ pressed }) => [
                styles.removeButton,
                { backgroundColor: c.foreground, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <X size={14} color={c.background} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <IconButton
            onPress={promptAttach}
            accessibilityLabel={t('composer.attachImage')}
            systemImage='paperclip'
            tone='muted'
          >
            <ImagePlus size={20} color={c.mutedForeground} />
          </IconButton>
          <TextInput
            style={[styles.input, { color: c.foreground }]}
            placeholder={
              staged
                ? t('composer.placeholderImage')
                : t('composer.placeholderDefault')
            }
            placeholderTextColor={c.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            editable={!disabled}
          />
          <IconButton
            onPress={handleSend}
            accessibilityLabel={t('composer.send')}
            systemImage='arrow.up'
            tone={canSend ? 'primary' : 'muted'}
          >
            <ArrowUp
              size={20}
              color={canSend ? c.primaryForeground : c.mutedForeground}
            />
          </IconButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    // paddingBottom is applied inline (tab-bar + keyboard aware).
  },
  shell: {
    gap: Spacing.two,
    borderWidth: Border.hairline,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  previewChip: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    marginLeft: Spacing.one,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
