import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ProposedChange } from '../types';
import { ProposalCardShell } from './proposal-card-shell';

type Props = {
  change: ProposedChange;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Generic confirmation card for any non-transaction write (create/update/delete
// of categories, essentials, budgets, tiers, income sources, plus expense /
// income edits + deletes). The model resolves real ids first; the user approves
// here before anything is applied.
export function ActionProposalCard({
  change,
  confirming,
  onConfirm,
  onCancel,
}: Props) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const destructive = change.action === 'delete';
  const actionLabel = t(`actionCard.actions.${change.action}`);
  const entityLabel = t(`actionCard.entities.${change.entity}`);
  const entries = Object.entries(change.data ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  return (
    <ProposalCardShell
      tone={destructive ? 'destructive' : 'primary'}
      title={`${actionLabel} ${entityLabel}`}
      confirmLabel={confirming ? t('actionCard.applying') : actionLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
      busy={confirming}
    >
      <AppText>{change.summary}</AppText>

      {!destructive && entries.length > 0 ? (
        <View style={[styles.data, { borderColor: c.border }]}>
          {entries.map(([key, value], i) => (
            <Fragment key={key}>
              {i > 0 ? (
                <View style={[styles.rule, { backgroundColor: c.border }]} />
              ) : null}
              <View style={styles.dataRow}>
                <AppText variant='caption' color='mutedForeground'>
                  {humanizeKey(key)}
                </AppText>
                <AppText variant='bodyMedium' style={styles.dataValue}>
                  {displayValue(value)}
                </AppText>
              </View>
            </Fragment>
          ))}
        </View>
      ) : null}
    </ProposalCardShell>
  );
}

const styles = StyleSheet.create({
  data: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  dataValue: { flexShrink: 1, textAlign: 'right' },
  rule: { height: StyleSheet.hairlineWidth },
});
