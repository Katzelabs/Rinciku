import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { passwordPolicy } from '@rinciku/domain/auth';

import { Fonts, Spacing } from '@/constants/theme';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';

// Renders the shared password policy as a live checklist. `passwordPolicy` is
// the same array that drives the Zod resolver, so the rules can never drift.
export function PasswordRules({ value }: { value: string }) {
  const c = useTheme();
  const { t } = useTranslation('auth');

  return (
    <View style={styles.list} accessibilityLiveRegion='polite'>
      {passwordPolicy.map((rule) => {
        const ok = rule.test(value);
        return (
          <View key={rule.id} style={styles.row}>
            <Icon
              name={ok ? 'checkmark.circle.fill' : 'circle'}
              size={15}
              color={ok ? c.primary : c.mutedForeground}
            />
            <Text
              style={[
                styles.label,
                { color: ok ? c.foreground : c.mutedForeground },
              ]}
            >
              {t(rule.labelKey)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.one, marginTop: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { fontFamily: Fonts.regular, fontSize: 13 },
});
