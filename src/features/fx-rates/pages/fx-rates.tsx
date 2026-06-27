import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { ensureRates, type CurrencyCode } from '@/lib/fx';
import { useFxStatus } from '@/lib/use-fx-status';
import { useAuth } from '@/features/auth';

import { CurrencyConverter } from '../components/currency-converter';
import { RateTable } from '../components/rate-table';

function formatRelative(iso: string | null, t: TFunction<'fxRates'>): string {
  if (!iso) return t('relative.never');
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return t('relative.recently');
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return t('relative.justNow');
  if (mins < 60) return t('relative.minutes', { count: mins });
  const hours = Math.round(mins / 60);
  if (hours < 48) return t('relative.hours', { count: hours });
  return t('relative.days', { count: Math.round(hours / 24) });
}

export function FxRatesPage() {
  const { t } = useTranslation('fxRates');
  const { profile } = useAuth();
  const status = useFxStatus();
  const [refreshing, setRefreshing] = useState(false);

  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  // Soft refresh on landing: fetches live only when stub/stale, else serves
  // cache. The Refresh button below still forces a fetch.
  useEffect(() => {
    void ensureRates();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await ensureRates({ force: true });
    } finally {
      setRefreshing(false);
    }
  }

  const fresh = status.source === 'live' && !status.stale;
  const tone = status.source === 'stub' ? 'bad' : fresh ? 'good' : 'warn';
  const statusLabel =
    status.source === 'stub'
      ? t('status.fallback')
      : fresh
        ? t('status.live')
        : status.source === 'cache'
          ? t('status.cached')
          : t('status.stale');
  const freshness =
    status.source === 'stub'
      ? t('status.snapshot', { date: status.stubDate })
      : t('status.updated', { time: formatRelative(status.lastFetchedAt, t) });

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {t('page.title')}
          </h1>
          <p className='max-w-prose text-sm text-muted-foreground'>
            {t('page.description', { currency: base })}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <span
              aria-hidden
              className={cn(
                'size-2 rounded-full',
                tone === 'good' && 'bg-emerald-500',
                tone === 'warn' && 'bg-amber-500',
                tone === 'bad' && 'bg-destructive'
              )}
            />
            <span>
              <span className='font-medium text-foreground'>{statusLabel}</span>
              <span className='hidden sm:inline'> · {freshness}</span>
            </span>
          </div>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? <Spinner data-icon='inline-start' /> : <RefreshCw />}
            {refreshing ? t('refresh.refreshing') : t('refresh.button')}
          </Button>
        </div>
      </div>

      {status.lastError && status.source !== 'live' && (
        <div className='rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
          {t('error.unreachable', { error: status.lastError })}
        </div>
      )}

      <CurrencyConverter base={base} />

      <Card>
        <CardHeader>
          <CardTitle>{t('table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RateTable base={base} />
        </CardContent>
      </Card>
    </div>
  );
}
