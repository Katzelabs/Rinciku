import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowUp } from 'lucide-react-native';

import { IconButton } from '@/components/ui';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Bottom composer bar: a growing multiline input + a send button. Enter inserts
// a newline (native multiline default); sending is via the button, matching the
// mobile keyboard idiom. Image attach is deferred to Phase 4.
export function MessageComposer({
  onSend,
  disabled = false,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const [text, setText] = useState('');

  const canSend = text.trim().length > 0 && !disabled;

  function handleSend() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: c.background, borderTopColor: c.border },
      ]}
    >
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: c.card, borderColor: c.input },
        ]}
      >
        <TextInput
          style={[styles.input, { color: c.foreground }]}
          placeholder={t('composer.placeholderDefault')}
          placeholderTextColor={c.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          editable={!disabled}
        />
      </View>
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
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderTopWidth: Border.hairline,
  },
  inputWrap: {
    flex: 1,
    borderWidth: Border.hairline,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    maxHeight: 120,
    paddingVertical: Spacing.two,
  },
});
