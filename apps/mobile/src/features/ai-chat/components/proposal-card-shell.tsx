import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sparkles } from '@/lib/icons';

import { AppText, Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { Button } from '@/features/auth/components/button';
import { useTheme } from '@/hooks/use-theme';

// Shared frame for the AI confirmation cards (expense / income / generic
// change): an accent-bordered card with a sparkle header + optional right slot,
// a body, and a Cancel / Confirm footer. Keeps the three cards consistent and
// small — read-auto / write-confirm means nothing is applied until Confirm.
export function ProposalCardShell({
  tone = 'primary',
  title,
  headerRight,
  children,
  onCancel,
  onConfirm,
  confirmLabel,
  busy = false,
  confirmDisabled = false,
}: {
  tone?: 'primary' | 'destructive';
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  busy?: boolean;
  // Blocks Confirm while Cancel stays available (e.g. unresolved change target).
  confirmDisabled?: boolean;
}) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const accent = tone === 'destructive' ? c.destructive : c.primary;

  return (
    <Card style={[styles.card, { borderColor: accent }]}>
      <View style={styles.header}>
        <Sparkles size={16} color={accent} />
        <AppText variant='bodyMedium' style={styles.title}>
          {title}
        </AppText>
        {headerRight}
      </View>

      <View style={styles.body}>{children}</View>

      <View style={styles.footer}>
        <Button
          label={t('common:actions.cancel')}
          variant='ghost'
          onPress={onCancel}
          disabled={busy}
          style={styles.footerButton}
        />
        <Button
          label={confirmLabel}
          variant={tone === 'destructive' ? 'destructive' : 'primary'}
          onPress={onConfirm}
          loading={busy}
          disabled={confirmDisabled}
          style={styles.footerButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  body: { gap: Spacing.three },
  footer: { flexDirection: 'row', gap: Spacing.two },
  footerButton: { flex: 1 },
});
