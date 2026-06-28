import type { ReactNode } from 'react';
import { formatCurrency } from '@rinciku/core';
import type { CurrencyCode } from '@rinciku/core';

// Tooltip row that renders the value as currency rather than a bare number.
// Wired into ChartTooltipContent's `formatter`, which replaces the default
// swatch + label + value row, so we reproduce that layout here.
export function currencyTooltipRow(
  value: unknown,
  color: string | undefined,
  label: ReactNode,
  base: CurrencyCode
) {
  return (
    <>
      <span
        className='h-2.5 w-2.5 shrink-0 rounded-[2px]'
        style={{ backgroundColor: color }}
      />
      <div className='flex flex-1 items-center justify-between gap-2 leading-none'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='ml-3 font-mono font-medium tabular-nums text-foreground'>
          {formatCurrency(Number(value), base)}
        </span>
      </div>
    </>
  );
}
