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
import type { Tier } from '@/features/categories/hooks/use-categories';
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

type Props = {
  cycle: Cycle;
  onCycleChange: (next: Cycle) => void;
  startDay: number;
  availableTiers: Tier[];
  selectedTierIds: Set<string>;
  onTiersChange: (next: Set<string>) => void;
};

export function ExpenseFilters({
  cycle,
  onCycleChange,
  startDay,
  availableTiers,
  selectedTierIds,
  onTiersChange,
}: Props) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const { from, to } = getCycleRange(cycle.year, cycle.month, startDay);
  const rangeLabel = `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`;

  function toggleTier(tierId: string) {
    const next = new Set(selectedTierIds);
    if (next.has(tierId)) {
      next.delete(tierId);
    } else {
      next.add(tierId);
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
        {availableTiers.map((tier) => {
          const active = selectedTierIds.has(tier.id);
          return (
            <Button
              key={tier.id}
              type='button'
              size='sm'
              variant={active ? 'default' : 'outline'}
              onClick={() => toggleTier(tier.id)}
              aria-pressed={active}
              className={cn('rounded-full')}
            >
              {tier.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
