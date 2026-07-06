import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Check, Copy } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const RESET_MS = 1600;

// A compact "copy to clipboard" affordance for assistant messages. Tapping is
// used (not long-press) on purpose: long-press collides with the native
// text-selection gesture on the selectable message body, so a visible tap
// target keeps both selection AND copy working. Briefly flips to a check +
// "Copied" label with a light haptic tick as confirmation.
export function CopyButton({ value }: { value: string }) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onPress = useCallback(async () => {
    await Clipboard.setStringAsync(value);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), RESET_MS);
  }, [value]);

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={copied ? t('copy.copied') : t('message.copyMessage')}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={styles.content}>
        {copied ? (
          <Check size={14} color={c.positive} />
        ) : (
          <Copy size={14} color={c.mutedForeground} />
        )}
        {copied ? (
          <AppText variant='overline' color='positive'>
            {t('copy.copied')}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
