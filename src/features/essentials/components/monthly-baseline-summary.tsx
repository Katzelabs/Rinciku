import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';
import { useAuth } from '@/features/auth';
import { useTiers } from '@/features/categories/hooks/use-categories';
import { listEssentials } from '../api';
import { computeBaseline, type Baseline } from '../lib/baseline';

type Props = {
  variant: 'footer' | 'card';
  refreshKey?: number;
  className?: string;
};

type Response = {
  key: string;
  baseline: Baseline | null;
  error: string | null;
};

export function MonthlyBaselineSummary({
  variant,
  refreshKey = 0,
  className,
}: Props) {
  const { t } = useTranslation('essentials');
  const { profile } = useAuth();
  const { data: tiers } = useTiers();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;
  const fetchKey = `${refreshKey}-${base}`;
  const [response, setResponse] = useState<Response | null>(null);

  useEffect(() => {
    let cancelled = false;
    listEssentials()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setResponse({ key: fetchKey, baseline: null, error: error.message });
          return;
        }
        setResponse({
          key: fetchKey,
          baseline: computeBaseline(data ?? [], base),
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setResponse({
          key: fetchKey,
          baseline: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, base]);

  const isLoading = response?.key !== fetchKey;
  const error = response?.error ?? null;
  const baseline = response?.baseline ?? null;

  if (variant === 'footer') {
    if (isLoading) {
      return (
        <div className={cn('flex justify-end', className)}>
          <Skeleton className='h-5 w-48' />
        </div>
      );
    }
    if (error || !baseline) {
      return (
        <p className={cn('text-right text-sm text-destructive', className)}>
          {t('summary.error')}
        </p>
      );
    }
    return (
      <p className={cn('text-right text-sm', className)}>
        <span className='text-muted-foreground'>{t('summary.labelInline')}</span>
        <span className='font-semibold'>
          {formatCurrency(baseline.total_base, base)}
        </span>
      </p>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className='space-y-3 pt-6'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-32' />
        </CardContent>
      </Card>
    );
  }
  if (error || !baseline) {
    return (
      <Card className={className}>
        <CardContent className='pt-6 text-sm text-destructive'>
          {t('summary.error')}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={className}>
      <CardContent className='space-y-3 pt-6'>
        <div>
          <p className='text-sm text-muted-foreground'>{t('summary.label')}</p>
          <p className='text-2xl font-semibold'>
            {formatCurrency(baseline.total_base, base)}
          </p>
        </div>
        <ul className='space-y-1 text-sm'>
          {(tiers ?? [])
            .filter((tier) => (baseline.by_tier[tier.id] ?? 0) > 0)
            .map((tier) => (
              <li
                key={tier.id}
                className='flex items-center justify-between text-muted-foreground'
              >
                <span>{tier.name}</span>
                <span className='font-medium text-foreground'>
                  {formatCurrency(baseline.by_tier[tier.id] ?? 0, base)}
                </span>
              </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
