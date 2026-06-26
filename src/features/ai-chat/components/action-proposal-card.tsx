import { Sparkles, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { ChangeAction, ProposedChange } from '../types';

type Props = {
  change: ProposedChange;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ACTION_META: Record<
  ChangeAction,
  { label: string; icon: typeof Plus; destructive: boolean }
> = {
  create: { label: 'Create', icon: Plus, destructive: false },
  update: { label: 'Update', icon: Pencil, destructive: false },
  delete: { label: 'Delete', icon: Trash2, destructive: true },
};

const ENTITY_LABEL: Record<ProposedChange['entity'], string> = {
  expense: 'expense',
  income: 'income',
  category: 'category',
  income_category: 'income source',
  essential: 'essential',
  budget: 'budget',
  tier: 'tier',
};

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
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
  const meta = ACTION_META[change.action];
  const Icon = meta.icon;
  const entries = Object.entries(change.data ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

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
          {meta.label} {ENTITY_LABEL[change.entity]}
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
          {meta.label}
        </span>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-sm text-foreground'>{change.summary}</p>
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
          Cancel
        </Button>
        <Button
          type='button'
          variant={meta.destructive ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={confirming}
        >
          {confirming && <Spinner data-icon='inline-start' />}
          {confirming ? 'Applying…' : meta.label}
        </Button>
      </CardFooter>
    </Card>
  );
}
