import { CalendarDays, Hash, Scale, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SummaryCard } from '@/components/shared/summary-card';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';

type Props = {
  total: number;
  count: number;
  days: number;
  baseCurrency: CurrencyCode;
  loading: boolean;
};

// Range-scoped summary cards above the incomes table. All values derive from
// the page's already-fetched filtered totals — no extra queries.
export function IncomeSummary({
  total,
  count,
  days,
  baseCurrency,
  loading,
}: Props) {
  const { t } = useTranslation('incomes');
  const avgPerTransaction = count ? total / count : 0;
  const avgPerDay = days ? total / days : 0;

  return (
    <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
      <SummaryCard
        label={t('summary.totalIncome')}
        value={formatCurrency(total, baseCurrency)}
        icon={Wallet}
        accent='var(--chart-2)'
        loading={loading}
      />
      <SummaryCard
        label={t('summary.transactions')}
        value={String(count)}
        icon={Hash}
        accent='var(--chart-3)'
        loading={loading}
      />
      <SummaryCard
        label={t('summary.avgPerTransaction')}
        value={formatCurrency(avgPerTransaction, baseCurrency)}
        icon={Scale}
        accent='var(--chart-4)'
        loading={loading}
      />
      <SummaryCard
        label={t('summary.avgPerDay')}
        value={formatCurrency(avgPerDay, baseCurrency)}
        icon={CalendarDays}
        accent='var(--chart-5)'
        hint={t('summary.overDays', { count: days })}
        loading={loading}
      />
    </div>
  );
}
