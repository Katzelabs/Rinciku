import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency, type CurrencyCode } from '@rinciku/core';
import { cn } from '@/lib/utils';
import type { ExportFormat, ProposedExport } from '../types';

type Props = {
  export_: ProposedExport;
  baseCurrency: CurrencyCode;
  preparing: boolean;
  onConfirm: (format: ExportFormat) => void;
  onCancel: () => void;
};

// Confirmation card for an export_transactions proposal. Stats come from
// resolveExport (real DB counts, not the model's claim); format is a card
// toggle rather than a tool param so the tool schema stays tight. Nothing is
// generated until the user confirms — mirrors the propose_* card pattern.
export function ExportCard({
  export_,
  baseCurrency,
  preparing,
  onConfirm,
  onCancel,
}: Props) {
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
    <Card className='border-primary/30 bg-primary/[0.03]'>
      <CardHeader className='flex-row items-center gap-2 space-y-0 pb-2'>
        <Sparkles className='size-4 text-primary' />
        <span className='text-sm font-medium'>{t('exportCard.heading')}</span>
        <span className='ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
          <FileSpreadsheet className='size-3' />
          {t(`exportCard.kinds.${export_.kind}`)}
        </span>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='rounded-md border bg-background/50 p-3 text-sm'>
          {export_.window ? (
            <p className='text-xs text-muted-foreground'>
              {t('exportCard.range', {
                from: export_.window.from,
                to: export_.window.to,
              })}
            </p>
          ) : null}
          {statLines.map((line) => (
            <p key={line} className='mt-1 font-medium'>
              {line}
            </p>
          ))}
          {statsUnavailable ? (
            <p className='mt-1 text-muted-foreground'>
              {t('exportCard.statsUnavailable')}
            </p>
          ) : null}
          {isEmpty ? (
            <p className='mt-1 font-medium text-destructive'>
              {t('exportCard.empty')}
            </p>
          ) : null}
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            {t('exportCard.format')}
          </span>
          <div className='inline-flex rounded-full border bg-background/50 p-0.5'>
            {(['xlsx', 'csv'] as const).map((f) => (
              <button
                key={f}
                type='button'
                onClick={() => setFormat(f)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  format === f
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(
                  f === 'xlsx'
                    ? 'exportCard.formatExcel'
                    : 'exportCard.formatCsv'
                )}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          onClick={onCancel}
          disabled={preparing}
        >
          {t('common:actions.cancel')}
        </Button>
        <Button
          type='button'
          onClick={() => onConfirm(format)}
          disabled={preparing || isEmpty}
        >
          {preparing && <Spinner data-icon='inline-start' />}
          {preparing ? t('exportCard.preparing') : t('exportCard.download')}
        </Button>
      </CardFooter>
    </Card>
  );
}
