import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { AppText, Pill } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ExportFormat, ProposedExport } from '../types';
import { ProposalCardShell } from './proposal-card-shell';

type Props = {
  export_: ProposedExport;
  baseCurrency: CurrencyCode;
  preparing: boolean;
  onConfirm: (format: ExportFormat) => void;
  onCancel: () => void;
};

// Confirmation card for an export_transactions proposal. Stats come from
// resolveExport (real DB counts, not the model's claim); the format is a card
// toggle rather than a tool param. Confirm opens the system share sheet —
// nothing is generated until the user taps Share.
export function ExportCard({
  export_,
  baseCurrency,
  preparing,
  onConfirm,
  onCancel,
}: Props) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const [format, setFormat] = useState<ExportFormat>('xlsx');

  const stats = export_.stats ?? null;
  const statLines: string[] = [];
  if (stats?.expenses) {
    statLines.push(
      t('exportCard.statsExpenses', {
        count: stats.expenses.count,
        total: formatCurrency(stats.expenses.total_base, baseCurrency),
      })
    );
  }
  if (stats?.incomes) {
    statLines.push(
      t('exportCard.statsIncomes', {
        count: stats.incomes.count,
        total: formatCurrency(stats.incomes.total_base, baseCurrency),
      })
    );
  }
  const statsUnavailable = stats !== null && statLines.length === 0;
  const rowCount = (stats?.expenses?.count ?? 0) + (stats?.incomes?.count ?? 0);
  const isEmpty = stats !== null && !statsUnavailable && rowCount === 0;

  return (
    <ProposalCardShell
      tone='primary'
      title={t('exportCard.heading')}
      confirmLabel={
        preparing ? t('exportCard.preparing') : t('exportCard.share')
      }
      onCancel={onCancel}
      onConfirm={() => onConfirm(format)}
      busy={preparing}
      confirmDisabled={isEmpty}
    >
      <View style={[styles.summary, { borderColor: c.border }]}>
        <AppText variant='caption' color='mutedForeground'>
          {t(`exportCard.kinds.${export_.kind}`)}
          {export_.window
            ? ` · ${t('exportCard.range', {
                from: export_.window.from,
                to: export_.window.to,
              })}`
            : ''}
        </AppText>
        {statLines.map((line) => (
          <AppText key={line} variant='bodyMedium'>
            {line}
          </AppText>
        ))}
        {statsUnavailable ? (
          <AppText variant='bodyMedium' color='mutedForeground'>
            {t('exportCard.statsUnavailable')}
          </AppText>
        ) : null}
        {isEmpty ? (
          <AppText variant='bodyMedium' style={{ color: c.destructive }}>
            {t('exportCard.empty')}
          </AppText>
        ) : null}
      </View>

      <View style={styles.formatRow}>
        <AppText variant='caption' color='mutedForeground'>
          {t('exportCard.format')}
        </AppText>
        <Pill
          label={t('exportCard.formatExcel')}
          tone={format === 'xlsx' ? 'primary' : 'outline'}
          onPress={() => setFormat('xlsx')}
          disabled={preparing}
        />
        <Pill
          label={t('exportCard.formatCsv')}
          tone={format === 'csv' ? 'primary' : 'outline'}
          onPress={() => setFormat('csv')}
          disabled={preparing}
        />
      </View>
    </ProposalCardShell>
  );
}

const styles = StyleSheet.create({
  summary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
