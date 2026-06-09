import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCycleRange, type Cycle } from '@/features/expenses/lib/cycle';

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
};

export function IncomeFilters({ cycle, onCycleChange, startDay }: Props) {
  const currentYear = new Date().getFullYear();
  const years = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
  ];

  const { from, to } = getCycleRange(cycle.year, cycle.month, startDay);
  const rangeLabel = `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`;

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
    </div>
  );
}
