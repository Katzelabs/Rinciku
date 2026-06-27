import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Scale,
  Wallet,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryCard } from '@/components/shared/summary-card';
import { getCurrentCycle } from '@/lib/cycle';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';
import { useAuth } from '@/features/auth';
import { useAnalytics } from '../hooks/use-analytics';
import type { AnalyticsFilters } from '../types';
import { AnalyticsFilters as AnalyticsFiltersBar } from './analytics-filters';
import { BudgetVsActualChart } from './budget-vs-actual-chart';
import { CategoryBreakdownChart } from './category-breakdown-chart';
import { IncomeVsExpenseChart } from './income-vs-expense-chart';
import { SpendTrendChart } from './spend-trend-chart';

const MS_PER_DAY = 86_400_000;

// The dashboard body: a date/category filter, range-scoped summary cards, then
// the analytics charts — all driven by the same filter. Defaults to the current
// cycle so the first paint matches the user's spending month.
export function AnalyticsSection() {
  const { t } = useTranslation('dashboard');
  const { profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;
  const [filters, setFilters] = useState<AnalyticsFilters>(() => {
    const cycle = getCurrentCycle({
      month_start_day: profile?.month_start_day ?? 1,
    });
    return { from: cycle.start, to: cycle.end, categoryIds: [] };
  });

  const { data, loading, error } = useAnalytics(profile, filters);

  const totalIncome =
    data?.trend.reduce((sum, point) => sum + point.income, 0) ?? 0;
  const totalSpent =
    data?.trend.reduce((sum, point) => sum + point.spent, 0) ?? 0;
  const net = totalIncome - totalSpent;
  const days = Math.max(
    1,
    Math.round((filters.to.getTime() - filters.from.getTime()) / MS_PER_DAY)
  );
  const avgPerDay = totalSpent / days;

  const hasTrend =
    data?.trend.some((point) => point.spent > 0 || point.income > 0) ?? false;
  const hasBreakdown =
    (data?.breakdown.byCategory.length ?? 0) > 0 ||
    (data?.breakdown.byTier.length ?? 0) > 0;
  const hasBudget = (data?.budget.length ?? 0) > 0;

  return (
    <div className='space-y-6'>
      <AnalyticsFiltersBar
        dateRange={{ from: filters.from, to: filters.to }}
        onDateRangeChange={(range) =>
          setFilters((prev) => ({ ...prev, from: range.from, to: range.to }))
        }
        categoryIds={filters.categoryIds}
        onCategoryIdsChange={(ids) =>
          setFilters((prev) => ({ ...prev, categoryIds: ids }))
        }
      />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <SummaryCard
          label={t('summary.income')}
          value={formatCurrency(totalIncome, base)}
          icon={Wallet}
          accent='var(--chart-2)'
          loading={loading}
        />
        <SummaryCard
          label={t('summary.spent')}
          value={formatCurrency(totalSpent, base)}
          icon={CreditCard}
          accent='var(--chart-1)'
          loading={loading}
        />
        <SummaryCard
          label={t('summary.net')}
          value={formatCurrency(net, base)}
          icon={Scale}
          accent={net < 0 ? 'var(--destructive)' : 'var(--chart-4)'}
          tone={net < 0 ? 'negative' : undefined}
          loading={loading}
        />
        <SummaryCard
          label={t('summary.avgPerDay')}
          value={formatCurrency(avgPerDay, base)}
          icon={CalendarDays}
          accent='var(--chart-3)'
          hint={t('summary.over', { count: days })}
          loading={loading}
        />
      </div>

      {error ? (
        <Alert variant='destructive'>
          <AlertCircle />
          <AlertTitle>{t('charts.loadError')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <ChartCard
            title={t('charts.trend.title')}
            description={t('charts.trend.description')}
            loading={loading}
            empty={!hasTrend}
            t={t}
          >
            {data ? <SpendTrendChart data={data.trend} base={base} /> : null}
          </ChartCard>

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <ChartCard
              title={t('charts.breakdown.title')}
              description={t('charts.breakdown.description')}
              loading={loading}
              empty={!hasBreakdown}
              t={t}
            >
              {data ? (
                <CategoryBreakdownChart data={data.breakdown} base={base} />
              ) : null}
            </ChartCard>

            <ChartCard
              title={t('charts.incomeVsExpense.title')}
              description={t('charts.incomeVsExpense.description')}
              loading={loading}
              empty={!hasTrend}
              t={t}
            >
              {data ? (
                <IncomeVsExpenseChart data={data.trend} base={base} />
              ) : null}
            </ChartCard>
          </div>

          <ChartCard
            title={t('charts.budgetVsActual.title')}
            description={t('charts.budgetVsActual.description')}
            loading={loading}
            empty={!hasBudget}
            emptyText={t('charts.budgetVsActual.empty')}
            t={t}
          >
            {data ? (
              <BudgetVsActualChart data={data.budget} base={base} />
            ) : null}
          </ChartCard>
        </>
      )}
    </div>
  );
}

function ChartCard({
  title,
  description,
  loading,
  empty,
  emptyText,
  t,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  empty: boolean;
  emptyText?: string;
  t: TFunction<'dashboard'>;
  children: ReactNode;
}) {
  const resolvedEmptyText = emptyText ?? t('charts.emptyDefault');
  return (
    <Card>
      <CardContent className='space-y-4 py-2'>
        <div>
          <h3 className='text-base font-semibold'>{title}</h3>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        {loading ? (
          <Skeleton className='h-[240px] w-full' />
        ) : empty ? (
          <div className='flex h-[200px] items-center justify-center rounded-md border border-dashed bg-muted/30 text-center text-sm text-muted-foreground'>
            {resolvedEmptyText}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
