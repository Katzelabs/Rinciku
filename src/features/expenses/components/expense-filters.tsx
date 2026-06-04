import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CategoryTier } from '@/features/categories/hooks/use-categories';
import { getCycleRange, type Cycle } from '../lib/cycle';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const TIER_LABELS: Record<CategoryTier, string> = {
  fixed: 'Fixed',
  needs: 'Needs',
  wants: 'Wants',
};

const TIER_ORDER: CategoryTier[] = ['fixed', 'needs', 'wants'];

type Props = {
  cycle: Cycle;
  onCycleChange: (next: Cycle) => void;
  startDay: number;
  tiers: Set<CategoryTier>;
  onTiersChange: (next: Set<CategoryTier>) => void;
};

export function ExpenseFilters({
  cycle,
  onCycleChange,
  startDay,
  tiers,
  onTiersChange,
}: Props) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const { from, to } = getCycleRange(cycle.year, cycle.month, startDay);
  const rangeLabel = `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`;

  function toggleTier(tier: CategoryTier) {
    const next = new Set(tiers);
    if (next.has(tier)) {
      next.delete(tier);
    } else {
      next.add(tier);
    }
    onTiersChange(next);
  }

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
      <div className='space-y-1'>
        <div className='flex gap-2'>
          <Select
            value={String(cycle.year)}
            onValueChange={(value) =>
              onCycleChange({ ...cycle, year: Number(value) })
            }
          >
            <SelectTrigger className='w-[110px]'>
              <SelectValue placeholder='Year' />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(cycle.month)}
            onValueChange={(value) =>
              onCycleChange({ ...cycle, month: Number(value) })
            }
          >
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Month' />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, idx) => (
                <SelectItem key={name} value={String(idx + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className='text-xs text-muted-foreground'>Cycle: {rangeLabel}</p>
      </div>

      <div className='flex flex-wrap gap-2'>
        {TIER_ORDER.map((tier) => {
          const active = tiers.has(tier);
          return (
            <Button
              key={tier}
              type='button'
              size='sm'
              variant={active ? 'default' : 'outline'}
              onClick={() => toggleTier(tier)}
              aria-pressed={active}
              className={cn('rounded-full')}
            >
              {TIER_LABELS[tier]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
