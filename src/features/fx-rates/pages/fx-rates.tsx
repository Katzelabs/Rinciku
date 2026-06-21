import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { ensureRates, type CurrencyCode } from '@/lib/fx';
import { useFxStatus } from '@/lib/use-fx-status';
import { useAuth } from '@/features/auth';

import { CurrencyConverter } from '../components/currency-converter';
import { RateTable } from '../components/rate-table';

function formatRelative(iso: string | null): string {
  if (!iso) return 'never';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return 'recently';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function FxRatesPage() {
  const { profile } = useAuth();
  const status = useFxStatus();
  const [refreshing, setRefreshing] = useState(false);

  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

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
      ? 'Fallback'
      : fresh
        ? 'Live'
        : status.source === 'cache'
          ? 'Cached'
          : 'Stale';
  const freshness =
    status.source === 'stub'
      ? `snapshot from ${status.stubDate}`
      : `updated ${formatRelative(status.lastFetchedAt)}`;

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Currency rates
          </h1>
          <p className='max-w-prose text-sm text-muted-foreground'>
            Live exchange rates used across the app to convert amounts into your
            base currency ({base}).
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
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {status.lastError && status.source !== 'live' && (
        <div className='rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
          Couldn't reach the live FX source: {status.lastError}
        </div>
      )}

      <CurrencyConverter base={base} />

      <Card>
        <CardHeader>
          <CardTitle>All rates</CardTitle>
        </CardHeader>
        <CardContent>
          <RateTable base={base} />
        </CardContent>
      </Card>
    </div>
  );
}
