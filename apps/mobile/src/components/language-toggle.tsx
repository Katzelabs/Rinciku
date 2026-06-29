import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { SUPPORTED_LANGUAGES } from '@rinciku/core/i18n/init';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';

// Lightweight EN/ID switch for the unauthenticated screens. Cycles to the next
// supported language; i18next persists the choice via the AsyncStorage detector
// (`cacheUserLanguage`). The signed-in app changes language from Settings, which
// also writes it to the profile.
export function LanguageToggle() {
  const c = useTheme();
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en') as string;
  const index = SUPPORTED_LANGUAGES.indexOf(current as never);
  const next = SUPPORTED_LANGUAGES[(index + 1) % SUPPORTED_LANGUAGES.length];

  return (
    <Pressable
      accessibilityRole='button'
      onPress={() => void i18n.changeLanguage(next)}
      style={[styles.pill, { borderColor: c.border, backgroundColor: c.card }]}
    >
      <Icon name='globe' size={14} color={c.mutedForeground} />
      <Text style={[styles.text, { color: c.foreground }]}>
        {current.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
    alignSelf: 'flex-end',
  },
  text: { fontFamily: Fonts.semibold, fontSize: 13 },
});
