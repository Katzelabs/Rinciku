import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PRESET_COLORS } from '../lib/colors';

type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  id?: string;
};

export function ColorPicker({ value, onChange, invalid, id }: ColorPickerProps) {
  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2'>
        {PRESET_COLORS.map((hex) => {
          const selected = hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={hex}
              type='button'
              title={hex}
              onClick={() => onChange(hex)}
              style={{ background: hex }}
              className={cn(
                'size-7 rounded-full border-2 transition-transform',
                selected
                  ? 'border-ring scale-110'
                  : 'border-transparent hover:scale-105'
              )}
            />
          );
        })}
      </div>
      <Input
        id={id}
        type='text'
        inputMode='text'
        placeholder='#RRGGBB'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        maxLength={7}
        className='font-mono'
      />
    </div>
  );
}
