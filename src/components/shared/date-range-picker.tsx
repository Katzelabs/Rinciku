import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type DateRangeValue = { from: Date; to: Date };

type Props = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
};

/**
 * Date-range picker (popover + two-month range calendar). Commits the range
 * only once both ends are chosen, normalizing to the full inclusive days.
 */
export function DateRangePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  });

  // Re-seed the in-popover draft from the committed value each time the picker
  // opens, so it always reflects the current range (e.g. reset to this month).
  function handleOpenChange(next: boolean) {
    if (next) setDraft({ from: value.from, to: value.to });
    setOpen(next);
  }

  function handleSelect(range: DateRange | undefined, selectedDay: Date) {
    // When a complete range is already drafted, react-day-picker extends the
    // existing `to` instead of letting you pick a new start — so a click inside
    // or after the range can never set `from`. Treat that click as the start of
    // a fresh range instead, restoring the intuitive start-then-end flow.
    if (draft?.from && draft?.to) {
      setDraft({ from: selectedDay, to: undefined });
      return;
    }
    setDraft(range);
    if (range?.from && range?.to) {
      const from = new Date(range.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(range.to);
      to.setHours(23, 59, 59, 999);
      onChange({ from, to });
      setOpen(false);
    }
  }

  const label = `${format(value.from, 'd MMM yyyy')} – ${format(value.to, 'd MMM yyyy')}`;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn('h-8 justify-start gap-2 font-normal', className)}
        >
          <CalendarIcon className='size-4 opacity-70' />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='range'
          defaultMonth={value.from}
          selected={draft}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
