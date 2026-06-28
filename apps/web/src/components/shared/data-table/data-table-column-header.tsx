import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

type Props<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

/**
 * Sortable column header. Renders a plain label when the column isn't sortable,
 * otherwise a button that cycles the sort direction (asc → desc → none).
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: Props<TData, TValue>) {
  // Reads live sort state off the stable TanStack `column`; opt out of the
  // compiler so the toggle direction + arrow stay current.
  'use no memo';

  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type='button'
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={cn(
        'inline-flex items-center gap-1 rounded transition-colors hover:text-foreground',
        className
      )}
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className='size-3.5' />
      ) : sorted === 'desc' ? (
        <ArrowDown className='size-3.5' />
      ) : (
        <ChevronsUpDown className='size-3.5 opacity-50' />
      )}
    </button>
  );
}
