import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCycleLabel } from '@/lib/cycle';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/features/auth';
import { getMonthlySummary, type MonthlySummary } from '../api';
import { BudgetHealthIndicator } from '../components/budget-health-indicator';
import { NeedsVsWantsBreakdown } from '../components/needs-vs-wants-breakdown';

type Response = {
  key: string;
  summary: MonthlySummary | null;
  error: string | null;
};

export function DashboardPage() {
  const { profile } = useAuth();
  const [reloadToken, setReloadToken] = useState(0);
  const fetchKey = profile ? `${profile.id}:${reloadToken}` : '';
  const [response, setResponse] = useState<Response | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    getMonthlySummary(profile)
      .then(({ data, error }) => {
        if (cancelled) return;
        setResponse({
          key: fetchKey,
          summary: data,
          error: error?.message ?? null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setResponse({
          key: fetchKey,
          summary: null,
          error:
            err instanceof Error ? err.message : 'Failed to load dashboard.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [profile, fetchKey]);

  const loading = !profile || response?.key !== fetchKey;
  const error = response?.error ?? null;
  const summary = response?.summary ?? null;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !summary) {
    return (
      <Alert variant='destructive'>
        <AlertCircle />
        <AlertTitle>Couldn't load this cycle</AlertTitle>
        <AlertDescription>{error ?? 'Failed to load dashboard.'}</AlertDescription>
        <AlertAction>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setReloadToken((n) => n + 1)}
          >
            Retry
          </Button>
        </AlertAction>
      </Alert>
    );
  }

  const cycleLabel = getCycleLabel(summary.cycle);
  const base = summary.base_currency;

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <p className='text-sm text-muted-foreground'>Cycle: {cycleLabel}</p>
        <h1 className='text-2xl font-semibold'>Dashboard</h1>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <SummaryCard
          label='Received this cycle'
          value={formatCurrency(summary.income_received, base)}
          secondary={
            summary.expected_monthly_income > 0
              ? `Expected baseline: ${formatCurrency(summary.expected_monthly_income, base)}`
              : undefined
          }
        />
        <SummaryCard
          label='Spent so far'
          value={formatCurrency(summary.spent_total, base)}
        />
        <SummaryCard
          label='Remaining'
          value={formatCurrency(summary.remaining, base)}
          tone={summary.remaining < 0 ? 'negative' : undefined}
        />
        <SummaryCard
          label='Days left'
          value={`${summary.days_left}`}
          hint={summary.days_left === 1 ? 'day' : 'days'}
        />
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Card>
          <CardContent className='space-y-4 py-2'>
            <div>
              <h2 className='text-base font-semibold'>Where it's going</h2>
              <p className='text-sm text-muted-foreground'>
                Fixed vs Needs vs Wants this cycle.
              </p>
            </div>
            <NeedsVsWantsBreakdown by_tier={summary.by_tier} base={base} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className='space-y-4 py-2'>
            <div>
              <h2 className='text-base font-semibold'>Budget health</h2>
              <p className='text-sm text-muted-foreground'>
                Are you on track for the rest of the cycle?
              </p>
            </div>
            <BudgetHealthIndicator summary={summary} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  secondary,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  secondary?: string;
  tone?: 'negative';
}) {
  return (
    <Card>
      <CardContent className='space-y-1 py-2'>
        <p className='text-sm text-muted-foreground'>{label}</p>
        <p
          className={cn(
            'text-2xl font-semibold tabular-nums',
            tone === 'negative' && 'text-destructive'
          )}
        >
          {value}
        </p>
        {secondary ? (
          <p className='text-xs text-muted-foreground tabular-nums'>
            {secondary}
          </p>
        ) : null}
        {hint ? (
          <p className='text-xs text-muted-foreground'>{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-8 w-48' />
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className='space-y-2 py-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-8 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Card>
          <CardContent className='space-y-4 py-2'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-28' />
          </CardContent>
        </Card>
        <Card>
          <CardContent className='space-y-4 py-2'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-6 w-20' />
            <Skeleton className='h-4 w-48' />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
