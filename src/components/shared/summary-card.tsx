import type { ElementType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type SummaryCardProps = {
  label: string;
  value: string;
  icon: ElementType;
  accent: string;
  hint?: string;
  tone?: 'negative';
  loading: boolean;
};

// A compact metric card: an accent bar keyed to a chart color, an icon badge,
// a label, and a large formatted value (with a skeleton while loading). Shared
// by the dashboard analytics and the incomes/expenses summary rows.
export function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
  tone,
  loading,
}: SummaryCardProps) {
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
