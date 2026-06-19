import * as React from 'react';
import { ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type MultiSelectOption = {
  label: string;
  value: string;
  color?: string | null;
};

type Props = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
};

/**
 * Combobox multiselect: a popover-anchored searchable list with checkable
 * items, rendering the current selection as badges in the trigger. Shared by
 * the expenses + incomes category filters.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'All',
  emptyText = 'No options.',
  searchPlaceholder = 'Search…',
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = options.filter((option) => value.includes(option.value));

  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('h-8 w-[220px] justify-between font-normal', className)}
        >
          <span className='flex flex-1 flex-wrap items-center gap-1 overflow-hidden'>
            {selected.length === 0 ? (
              <span className='text-muted-foreground'>{placeholder}</span>
            ) : selected.length <= 2 ? (
              selected.map((option) => (
                <Badge
                  key={option.value}
                  variant='secondary'
                  className='max-w-[140px] truncate'
                >
                  {option.label}
                </Badge>
              ))
            ) : (
              <Badge variant='secondary'>{selected.length} selected</Badge>
            )}
          </span>
          <ChevronsUpDown className='size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[240px] p-0' align='start'>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => toggle(option.value)}
                  data-checked={value.includes(option.value)}
                >
                  {option.color ? (
                    <span
                      aria-hidden
                      className='size-2.5 shrink-0 rounded-full'
                      style={{ backgroundColor: option.color }}
                    />
                  ) : null}
                  <span className='truncate'>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {value.length > 0 ? (
            <div className='border-t border-border/50 p-1'>
              <Button
                variant='ghost'
                size='sm'
                className='w-full justify-start text-muted-foreground'
                onClick={() => onChange([])}
              >
                <X className='size-3.5' />
                Clear
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
