import * as React from 'react';
import { ChevronsUpDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { CURRENCY_CODES, type CurrencyCode } from '@rinciku/core';
import { CURRENCY_NAMES } from '@rinciku/core';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type Props = {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function CurrencySelect({
  value,
  onChange,
  disabled,
  className,
  id,
}: Props) {
  const { t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className='truncate'>
            {value} — {CURRENCY_NAMES[value]}
          </span>
          <ChevronsUpDownIcon className='size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popover-trigger-width) p-0'>
        <Command>
          <CommandInput placeholder={t('currency.search')} />
          <CommandList>
            <CommandEmpty>{t('currency.empty')}</CommandEmpty>
            <CommandGroup>
              {CURRENCY_CODES.map((code) => (
                <CommandItem
                  key={code}
                  value={`${code} ${CURRENCY_NAMES[code]}`}
                  data-checked={value === code ? 'true' : 'false'}
                  onSelect={() => {
                    onChange(code);
                    setOpen(false);
                  }}
                >
                  <span className='font-medium'>{code}</span>
                  <span className='text-muted-foreground'>
                    {CURRENCY_NAMES[code]}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
