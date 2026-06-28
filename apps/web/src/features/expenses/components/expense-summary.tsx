import { CalendarDays, CreditCard, Receipt, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SummaryCard } from '@/components/shared/summary-card';
import { formatCurrency } from '@rinciku/core';
import type { CurrencyCode } from '@rinciku/core';

type Props = {
  total: number;
  count: number;
  days: number;
  baseCurrency: CurrencyCode;
  loading: boolean;
};

// Range-scoped summary cards above the expenses table. All values derive from
// the page's already-fetched filtered totals — no extra queries.
export function ExpenseSummary({
  total,
  count,
  days,
  baseCurrency,
  loading,
}: Props) {
  const { t } = useTranslation('expenses');
  const avgPerTransaction = count ? total / count : 0;
  const avgPerDay = days ? total / days : 0;

  return (
    <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
      <SummaryCard
        label={t('summary.totalSpent')}
        value={formatCurrency(total, baseCurrency)}
        icon={CreditCard}
        accent='var(--chart-1)'
        loading={loading}
      />
      <SummaryCard
        label={t('summary.transactions')}
        value={String(count)}
        icon={Receipt}
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
