import { StyleSheet, View } from 'react-native';
import { Sparkles } from '@/lib/icons';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Compact identity marker (sparkle badge + brand name) that sits above every
// assistant turn — both finished messages and the in-flight typing indicator —
// so an AI reply is instantly distinguishable from the right-hugging user
// bubbles and a forming turn reads as the same shape as the message it becomes.
export function AssistantMarker() {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: c.muted }]}>
        <Sparkles size={12} color={c.primary} />
      </View>
      <AppText variant='overline' color='mutedForeground'>
        Rinciku
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
