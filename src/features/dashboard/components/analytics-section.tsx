import { useState, type ElementType, type ReactNode } from 'react';
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
import { cn } from '@/lib/utils';
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
          label='Income'
          value={formatCurrency(totalIncome, base)}
          icon={Wallet}
          accent='var(--chart-2)'
          loading={loading}
        />
        <SummaryCard
          label='Spent'
          value={formatCurrency(totalSpent, base)}
          icon={CreditCard}
          accent='var(--chart-1)'
          loading={loading}
        />
        <SummaryCard
          label='Net'
          value={formatCurrency(net, base)}
          icon={Scale}
          accent={net < 0 ? 'var(--destructive)' : 'var(--chart-4)'}
          tone={net < 0 ? 'negative' : undefined}
          loading={loading}
        />
        <SummaryCard
          label='Avg / day'
          value={formatCurrency(avgPerDay, base)}
          icon={CalendarDays}
          accent='var(--chart-3)'
          hint={`over ${days} ${days === 1 ? 'day' : 'days'}`}
          loading={loading}
        />
      </div>

      {error ? (
        <Alert variant='destructive'>
          <AlertCircle />
          <AlertTitle>Couldn't load analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <ChartCard
            title='Spending trend'
            description='Spend and income over the selected range.'
            loading={loading}
            empty={!hasTrend}
          >
            {data ? <SpendTrendChart data={data.trend} base={base} /> : null}
          </ChartCard>

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <ChartCard
              title='Where it goes'
              description='Spend by category and tier.'
              loading={loading}
              empty={!hasBreakdown}
            >
              {data ? (
                <CategoryBreakdownChart data={data.breakdown} base={base} />
              ) : null}
            </ChartCard>

            <ChartCard
              title='Income vs expenses'
              description='Money in vs out per period.'
              loading={loading}
              empty={!hasTrend}
            >
              {data ? (
                <IncomeVsExpenseChart data={data.trend} base={base} />
              ) : null}
            </ChartCard>
          </div>

          <ChartCard
            title='Budget vs actual'
            description='Per-category targets against spend (targets summed across the range).'
            loading={loading}
            empty={!hasBudget}
            emptyText='No budgets set for this range.'
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

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
  tone,
  loading,
}: {
  label: string;
  value: string;
  icon: ElementType;
  accent: string;
  hint?: string;
  tone?: 'negative';
  loading: boolean;
}) {
  return (
    <Card className='relative overflow-hidden transition-shadow hover:shadow-sm'>
      {/* Accent bar keys the card to the metric's chart color. */}
      <span
        aria-hidden
        className='absolute inset-x-0 top-0 h-0.5'
        style={{ backgroundColor: accent }}
      />
      <CardContent className='py-2'>
        <div className='flex items-center justify-between gap-2'>
          <p className='text-sm font-medium text-muted-foreground'>{label}</p>
          <span
            aria-hidden
            className='flex size-9 shrink-0 items-center justify-center rounded-lg'
            style={{
              backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)`,
            }}
          >
            <Icon className='size-5' style={{ color: accent }} />
          </span>
        </div>
        {loading ? (
          <Skeleton className='mt-3 h-8 w-32' />
        ) : (
          <p
            className={cn(
              'mt-2 text-2xl font-semibold tracking-tight tabular-nums',
              tone === 'negative' && 'text-destructive'
            )}
          >
            {value}
          </p>
        )}
        {hint && !loading ? (
          <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  loading,
  empty,
  emptyText = 'No spending in this range.',
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  empty: boolean;
  emptyText?: string;
  children: ReactNode;
}) {
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
            {emptyText}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
