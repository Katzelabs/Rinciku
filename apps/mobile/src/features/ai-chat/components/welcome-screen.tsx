import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react-native';

import { AppText, Card, Divider } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Group = { label: string; examples: string[] };

// Empty-state for a fresh chat: a short intro plus tappable example prompts
// grouped by intent. Tapping a prompt sends it immediately (same as the web
// welcome screen). Reuses the authored aiChat.welcome.* strings.
export function WelcomeScreen({ onPick }: { onPick: (text: string) => void }) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');

  const groups: Group[] = [
    {
      label: t('welcome.groups.affordability'),
      examples: [t('welcome.examples.afford1'), t('welcome.examples.afford2')],
    },
    {
      label: t('welcome.groups.logTransaction'),
      examples: [t('welcome.examples.log1'), t('welcome.examples.log2')],
    },
    {
      label: t('welcome.groups.monthlySummary'),
      examples: [t('welcome.examples.summary1'), t('welcome.examples.summary2')],
    },
  ];

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps='handled'
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={[styles.badge, { backgroundColor: c.muted }]}>
          <Sparkles size={22} color={c.primary} />
        </View>
        <AppText variant='title'>{t('welcome.heading')}</AppText>
        <AppText variant='body' color='mutedForeground'>
          {t('welcome.description')}
        </AppText>
      </View>

      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <AppText variant='overline' color='mutedForeground'>
            {group.label}
          </AppText>
          <Card padding={0}>
            {group.examples.map((example, i) => (
              <Fragment key={example}>
                {i > 0 ? <Divider /> : null}
                <Pressable
                  accessibilityRole='button'
                  onPress={() => onPick(example)}
                  style={({ pressed }) => [
                    styles.example,
                    pressed ? { backgroundColor: c.muted } : null,
                  ]}
                >
                  <AppText style={styles.exampleText}>{example}</AppText>
                </Pressable>
              </Fragment>
            ))}
          </Card>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  hero: { gap: Spacing.two },
  badge: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  group: { gap: Spacing.two },
  example: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius['2xl'],
  },
  exampleText: { flexShrink: 1 },
});
