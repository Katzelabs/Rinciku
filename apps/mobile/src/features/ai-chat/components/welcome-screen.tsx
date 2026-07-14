import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sparkles } from '@/lib/icons';

import { AppText } from '@/components/ui';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Empty-state for a fresh chat: a minimal centered hero plus three short starter
// pills (one per intent — tapping sends it immediately). Deliberately airy: the
// old six stacked cards crowded the composer and invited mis-taps. To ask a
// free-form question the user just taps the composer below.
export function WelcomeScreen({
  onPick,
  topInset = 0,
}: {
  /** Send a starter prompt immediately. */
  onPick: (text: string) => void;
  /** Clearance so the hero clears the transparent header. */
  topInset?: number;
}) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');

  const starters = [
    t('welcome.starters.afford'),
    t('welcome.starters.log'),
    t('welcome.starters.summary'),
  ];

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Spacing.six + topInset },
      ]}
      keyboardShouldPersistTaps='handled'
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={[styles.badge, { backgroundColor: c.muted }]}>
          <Sparkles size={24} color={c.primary} />
        </View>
        <AppText variant='title' style={styles.center}>
          {t('welcome.heading')}
        </AppText>
        <AppText variant='body' color='mutedForeground' style={styles.center}>
          {t('welcome.description')}
        </AppText>
      </View>

      <View style={styles.chips}>
        {starters.map((label) => (
          <Pressable
            key={label}
            accessibilityRole='button'
            onPress={() => onPick(label)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: pressed ? c.muted : c.card,
                borderColor: c.border,
              },
            ]}
          >
            <AppText variant='bodyMedium'>{label}</AppText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.five,
  },
  hero: { alignItems: 'center', gap: Spacing.two },
  badge: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  center: { textAlign: 'center' },
  chips: { alignItems: 'center', gap: Spacing.two },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: Border.hairline,
    borderCurve: 'continuous',
  },
});
