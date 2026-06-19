import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props<TData> = {
  table: Table<TData>;
  pageSizeOptions?: number[];
};

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
}: Props<TData>) {
  // Reads live pagination state off the stable TanStack `table`; opt out of the
  // compiler so the page indicator + rows-per-page select stay current.
  'use no memo';

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger className='w-[72px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex items-center gap-3'>
        <span className='text-sm text-muted-foreground'>
          Page {pageIndex + 1} of {pageCount}
        </span>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label='First page'
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label='Previous page'
          >
            <ChevronLeft />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label='Next page'
          >
            <ChevronRight />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label='Last page'
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
