import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { DataTablePagination } from './data-table-pagination';

// Per-column styling escape hatch (e.g. right-aligning the amount column).
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  /** Rendered inside `<TableFooter>` (e.g. the totals row). */
  footer?: React.ReactNode;
  pageSizeOptions?: number[];
  /**
   * Server-side ("manual") pagination. Pass `pagination`, `pageCount`, and
   * `onPaginationChange` together to let the parent drive paging via the API.
   * Omit them for in-browser pagination over `data`.
   */
  pagination?: PaginationState;
  pageCount?: number;
  onPaginationChange?: OnChangeFn<PaginationState>;
  /**
   * Draw the table's own border + rounding. Set to `false` when the table is
   * already framed by a parent (e.g. a `Card`) to avoid a doubled border.
   */
  bordered?: boolean;
};

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyMessage = 'No results.',
  footer,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  pagination,
  pageCount,
  onPaginationChange,
  bordered = true,
}: DataTableProps<TData, TValue>) {
  // TanStack Table stores state inside a stable `table` object; the React
  // Compiler can't see those mutations and would serve stale renders.
  'use no memo';

  const manual = pagination !== undefined && onPaginationChange !== undefined;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [clientPagination, setClientPagination] =
    React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manual ? undefined : getPaginationRowModel(),
    // Keep column sorting a two-state toggle (asc ↔ desc) — never clears.
    enableSortingRemoval: false,
    manualPagination: manual,
    pageCount: manual ? pageCount : undefined,
    onSortingChange: setSorting,
    onPaginationChange: manual ? onPaginationChange : setClientPagination,
    state: {
      sorting,
      pagination: manual ? pagination : clientPagination,
    },
  });

  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;

  return (
    <div className='space-y-3'>
      <div className={cn(bordered && 'rounded-md border')}>
        <Table className='[&_th]:text-xs [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase [&_td]:py-3'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.headerClassName}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className='py-12'>
                  <div className='flex items-center justify-center'>
                    <Spinner />
                  </div>
                </TableCell>
              </TableRow>
            ) : hasRows ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='py-10 text-center text-sm text-muted-foreground'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {footer && !isLoading && hasRows ? (
            <TableFooter>{footer}</TableFooter>
          ) : null}
        </Table>
      </div>
      <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  );
}
