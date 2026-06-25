import { CalendarDays, Hash, Scale, Wallet } from 'lucide-react';
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
  const avgPerTransaction = count ? total / count : 0;
  const avgPerDay = days ? total / days : 0;

  return (
    <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
      <SummaryCard
        label='Total income'
        value={formatCurrency(total, baseCurrency)}
        icon={Wallet}
        accent='var(--chart-2)'
        loading={loading}
      />
      <SummaryCard
        label='Transactions'
        value={String(count)}
        icon={Hash}
        accent='var(--chart-3)'
        loading={loading}
      />
      <SummaryCard
        label='Avg / transaction'
        value={formatCurrency(avgPerTransaction, baseCurrency)}
        icon={Scale}
        accent='var(--chart-4)'
        loading={loading}
      />
      <SummaryCard
        label='Avg / day'
        value={formatCurrency(avgPerDay, baseCurrency)}
        icon={CalendarDays}
        accent='var(--chart-5)'
        hint={`over ${days} ${days === 1 ? 'day' : 'days'}`}
        loading={loading}
      />
    </div>
  );
}
