import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, PiggyBank } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import {
  getBudgetsView,
  type BudgetsView,
} from '@/features/budgets/hooks/use-budgets';

// Compact dashboard summary of budget-vs-actual for the current cycle. Reuses
// the budgets feature's view-model orchestration (getBudgetsView).
export function BudgetTargetsCard() {
  const { t } = useTranslation('dashboard');
  const { profile } = useAuth();
  const [view, setView] = useState<BudgetsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    getBudgetsView(profile)
      .then(({ data, error }) => {
        if (cancelled) return;
        setView(data);
        setError(error);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : t('targets.loadError')
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, t]);

  return (
    <Card>
      <CardContent className='space-y-4 py-2'>
        <div className='flex items-center justify-between gap-2'>
          <div>
            <h2 className='text-base font-semibold'>{t('targets.title')}</h2>
            <p className='text-sm text-muted-foreground'>
              {t('targets.subtitle')}
            </p>
          </div>
          <PiggyBank className='size-5 shrink-0 text-muted-foreground' />
        </div>

        {loading ? (
          <div className='space-y-2'>
            <Skeleton className='h-8 w-40' />
            <Skeleton className='h-4 w-48' />
          </div>
        ) : error ? (
          <p className='text-sm text-destructive'>{error}</p>
        ) : !view || view.targetCount === 0 ? (
          <p className='text-sm text-muted-foreground'>
            {t('targets.empty')}
          </p>
        ) : (
          <div className='flex items-baseline gap-6'>
            <div>
              <p className='text-2xl font-semibold tabular-nums text-destructive'>
                {view.overCount}
              </p>
              <p className='text-xs text-muted-foreground'>
                {t('targets.overBudget')}
              </p>
            </div>
            <div>
              <p className='text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-500'>
                {view.approachingCount}
              </p>
              <p className='text-xs text-muted-foreground'>
                {t('targets.nearLimit')}
              </p>
            </div>
            <div>
              <p className='text-2xl font-semibold tabular-nums'>
                {view.targetCount}
              </p>
              <p className='text-xs text-muted-foreground'>
                {t('targets.tracked')}
              </p>
            </div>
          </div>
        )}

        <Button variant='outline' size='sm' asChild>
          <Link to='/budgets'>
            {view && view.targetCount === 0
              ? t('targets.setBudgets')
              : t('targets.viewBudgets')}
            <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
