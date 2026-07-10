import { useTranslation } from 'react-i18next';
import { Sparkles, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency, formatDate, type CurrencyCode } from '@rinciku/core';
import { cn } from '@/lib/utils';
import type {
  ChangeAction,
  ChangeTargetRecord,
  ProposedChange,
} from '../types';

type Props = {
  change: ProposedChange;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ACTION_META: Record<
  ChangeAction,
  { icon: typeof Plus; destructive: boolean }
> = {
  create: { icon: Plus, destructive: false },
  update: { icon: Pencil, destructive: false },
  delete: { icon: Trash2, destructive: true },
};

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// One-line identity of the actual row an update/delete points at, e.g.
// "Coffee · Rp 25.000 · 5 Jul 2026". Built from the DB row, not model output.
function targetLine(record: ChangeTargetRecord, unnamed: string): string {
  const parts: string[] = [record.name?.trim() || unnamed];
  if (record.amount != null && record.currency)
    parts.push(formatCurrency(record.amount, record.currency as CurrencyCode));
  if (record.occurred_at)
    parts.push(formatDate(new Date(record.occurred_at), 'd MMM yyyy'));
  if (record.period) parts.push(record.period);
  return parts.join(' · ');
}

// Generic confirmation card for any non-transaction write (create/update/delete
// of categories, essentials, budgets, tiers, income sources, plus expense /
// income edits + deletes). The model resolves real ids first; the user approves
// here before anything is applied.
export function ActionProposalCard({
  change,
  confirming,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation('aiChat');
  const meta = ACTION_META[change.action];
  const Icon = meta.icon;
  const actionLabel = t(`actionCard.actions.${change.action}`);
  const entityLabel = t(`actionCard.entities.${change.entity}`);
  const entries = Object.entries(change.data ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );
  // Update/delete proposals carry the resolved target row (ground truth); a
  // target that didn't resolve blocks confirm — fail closed.
  const target = change.target ?? null;
  const targetBlocked = target !== null && target.status !== 'found';

  return (
    <Card
      className={cn(
        change.action === 'delete'
          ? 'border-destructive/30 bg-destructive/[0.03]'
          : 'border-primary/30 bg-primary/[0.03]'
      )}
    >
      <CardHeader className='flex-row items-center gap-2 space-y-0 pb-2'>
        <Sparkles
          className={cn(
            'size-4',
            meta.destructive ? 'text-destructive' : 'text-primary'
          )}
        />
        <span className='text-sm font-medium'>
          {actionLabel} {entityLabel}
        </span>
        <span
          className={cn(
            'ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            meta.destructive
              ? 'bg-destructive/10 text-destructive'
              : 'bg-primary/10 text-primary'
          )}
        >
          <Icon className='size-3' />
          {actionLabel}
        </span>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-sm text-foreground'>{change.summary}</p>
        {target?.status === 'found' ? (
          <div className='rounded-md border bg-background/50 p-3 text-sm'>
            <p className='text-xs text-muted-foreground'>
              {t('actionCard.target')}
            </p>
            <p className='mt-1 font-medium'>
              {targetLine(target.record, t('actionCard.targetUnnamed'))}
            </p>
          </div>
        ) : null}
        {targetBlocked ? (
          <p className='flex items-start gap-2 text-sm font-medium text-destructive'>
            <TriangleAlert className='mt-0.5 size-4 shrink-0' />
            {t(
              target?.status === 'missing'
                ? 'actionCard.targetMissing'
                : 'actionCard.targetUnverified'
            )}
          </p>
        ) : null}
        {change.action !== 'delete' && entries.length > 0 ? (
          <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md border bg-background/50 p-3 text-sm'>
            {entries.map(([key, value]) => (
              <div key={key} className='contents'>
                <dt className='text-muted-foreground'>{humanizeKey(key)}</dt>
                <dd className='min-w-0 break-words font-medium'>
                  {displayValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          onClick={onCancel}
          disabled={confirming}
        >
          {t('common:actions.cancel')}
        </Button>
        <Button
          type='button'
          variant={meta.destructive ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={confirming || targetBlocked}
        >
          {confirming && <Spinner data-icon='inline-start' />}
          {confirming ? t('actionCard.applying') : actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
