import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CATEGORY_ICONS } from '../lib/icons';
import { CategoryIcon } from './category-icon';

type IconPickerProps = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  id?: string;
};

export function IconPicker({ value, onChange, invalid, id }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('categories');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          className='w-full justify-between'
          aria-invalid={invalid || undefined}
        >
          <span className='flex items-center gap-2'>
            <CategoryIcon name={value} className='size-4' />
            <span className={cn(!value && 'text-muted-foreground')}>
              {value || t('form.pickIcon')}
            </span>
          </span>
          <ChevronDown className='size-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-72 p-2' align='start'>
        <div className='grid grid-cols-6 gap-1'>
          {CATEGORY_ICONS.map((name) => {
            const selected = name === value;
            return (
              <button
                key={name}
                type='button'
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg border transition-colors',
                  selected
                    ? 'border-ring bg-accent text-accent-foreground'
                    : 'border-transparent hover:bg-accent/50'
                )}
              >
                <CategoryIcon name={name} className='size-4' />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
