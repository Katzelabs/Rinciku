import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatCurrency, formatDate, type CurrencyCode } from '@rinciku/core';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChangeTargetRecord, ProposedChange } from '../types';
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

// One-line identity of the actual row an update/delete points at, e.g.
// "Coffee · Rp 25.000 · 5 Jul 2026". Built from the DB row, not model output.
function targetLine(record: ChangeTargetRecord, unnamed: string): string {
  const parts: string[] = [record.name?.trim() || unnamed];
  if (record.amount != null && record.currency)
    parts.push(formatCurrency(record.amount, record.currency as CurrencyCode));
  if (record.occurred_at)
    parts.push(formatDate(new Date(record.occurred_at), 'd MMM yyyy'));
  if (record.period) parts.push(record.period);
  return parts.join(' · ');
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
  // Update/delete proposals carry the resolved target row (ground truth); a
  // target that didn't resolve blocks confirm — fail closed.
  const target = change.target ?? null;
  const targetBlocked = target !== null && target.status !== 'found';

  return (
    <ProposalCardShell
      tone={destructive ? 'destructive' : 'primary'}
      title={`${actionLabel} ${entityLabel}`}
      confirmLabel={confirming ? t('actionCard.applying') : actionLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
      busy={confirming}
      confirmDisabled={targetBlocked}
    >
      <AppText>{change.summary}</AppText>

      {target?.status === 'found' ? (
        <View style={[styles.target, { borderColor: c.border }]}>
          <AppText variant='caption' color='mutedForeground'>
            {t('actionCard.target')}
          </AppText>
          <AppText variant='bodyMedium'>
            {targetLine(target.record, t('actionCard.targetUnnamed'))}
          </AppText>
        </View>
      ) : null}

      {targetBlocked ? (
        <AppText variant='bodyMedium' style={{ color: c.destructive }}>
          {t(
            target?.status === 'missing'
              ? 'actionCard.targetMissing'
              : 'actionCard.targetUnverified'
          )}
        </AppText>
      ) : null}

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
  target: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
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
