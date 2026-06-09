import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ensureRates } from '@/lib/fx';
import { useFxStatus } from '@/lib/use-fx-status';

function formatRelative(iso: string | null): string {
  if (!iso) return 'never';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return 'recently';
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function FxBanner() {
  const status = useFxStatus();
  const [refreshing, setRefreshing] = useState(false);

  if (status.source === 'live' && !status.stale) {
    return null;
  }

  const isStub = status.source === 'stub';
  const title = isStub
    ? 'Showing fallback FX rates'
    : 'FX rates may be outdated';
  const description = isStub
    ? `Couldn't reach the FX source. Totals use the snapshot from ${status.stubDate}.`
    : `Last refreshed ${formatRelative(status.lastFetchedAt)}.`;

  async function handleRetry() {
    setRefreshing(true);
    try {
      await ensureRates({ force: true });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Alert>
      <AlertTriangle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <AlertAction>
        <Button
          size='sm'
          variant='outline'
          onClick={handleRetry}
          disabled={refreshing}
        >
          {refreshing && <Spinner data-icon='inline-start' />}
          {refreshing ? 'Retrying…' : 'Retry'}
        </Button>
      </AlertAction>
    </Alert>
  );
}
