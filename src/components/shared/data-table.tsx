import type * as React from 'react';
import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * Shared list-table wrapper. Owns the bordered container plus the header /
 * row-spacing styling so the expenses, incomes, and essentials tables stay
 * visually consistent. Compose the usual `Table*` primitives as children.
 */
export function DataTable({
  className,
  ...props
}: React.ComponentProps<'table'>) {
  return (
    <div className='rounded-md border'>
      <Table
        className={cn(
          '[&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground [&_td]:py-3',
          className
        )}
        {...props}
      />
    </div>
  );
}
