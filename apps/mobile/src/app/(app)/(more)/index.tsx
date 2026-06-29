import { Link, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The "More" tab: a native-style grouped list linking to the secondary
// destinations that don't warrant a top-level tab.
export default function MoreScreen() {
  const c = useTheme();
  const { t } = useTranslation('common');

  const rows: { href: Href; label: string }[] = [
    { href: '/budgets', label: t('nav.items.budgets') },
    { href: '/essentials', label: t('nav.items.essentials') },
    { href: '/categories', label: t('nav.items.categories') },
    { href: '/fx', label: t('nav.items.rates') },
    { href: '/settings', label: t('settings.title') },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={styles.content}
    >
      <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
        {rows.map((row, i) => (
          <Link key={row.href as string} href={row.href} asChild>
            <Pressable
              style={({ pressed }) => [
                styles.row,
                i > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: c.muted },
              ]}
            >
              <Text style={[styles.label, { color: c.foreground }]}>
                {row.label}
              </Text>
              <Text style={[styles.chevron, { color: c.mutedForeground }]}>›</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four },
  group: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    minHeight: 52,
  },
  label: { fontFamily: Fonts.medium, fontSize: 16 },
  chevron: { fontFamily: Fonts.regular, fontSize: 22 },
});
