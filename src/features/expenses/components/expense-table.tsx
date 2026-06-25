import { format } from 'date-fns';
import { toast } from 'sonner';
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table';
import { CategoryTag } from '@/components/shared/category-tag';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/shared/data-table';
import { RowActions } from '@/components/shared/row-actions';
import { TableCell, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { convertToBase, type CurrencyCode } from '@/lib/fx';
import { getAttachmentSignedUrl, type ExpenseWithRelations } from '../api';

type Props = {
  rows: ExpenseWithRelations[];
  total: number;
  baseCurrency: CurrencyCode;
  isLoading?: boolean;
  pagination: PaginationState;
  pageCount: number;
  onPaginationChange: OnChangeFn<PaginationState>;
  onView: (row: ExpenseWithRelations) => void;
  onEdit: (row: ExpenseWithRelations) => void;
  onDelete: (row: ExpenseWithRelations) => void;
  bordered?: boolean;
};

export function ExpenseTable({
  rows,
  total,
  baseCurrency,
  isLoading,
  pagination,
  pageCount,
  onPaginationChange,
  onView,
  onEdit,
  onDelete,
  bordered,
}: Props) {
  // On narrow screens drop the Category and Actions columns to fit Date · Note ·
  // Amount without horizontal scroll; row tap opens the detail view for edits.
  const isMobile = useIsMobile();

  async function openAttachment(path: string) {
    const { data, error } = await getAttachmentSignedUrl(path);
    if (error || !data?.signedUrl) {
      toast.error('Could not open the attachment.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  const columns: ColumnDef<ExpenseWithRelations>[] = [
    {
      accessorKey: 'occurred_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Date' />
      ),
      cell: ({ row }) => (
        <span className='whitespace-nowrap text-muted-foreground'>
          {format(new Date(row.original.occurred_at), 'd MMM yyyy')}
        </span>
      ),
      meta: { headerClassName: 'w-[130px]' },
    },
    ...(isMobile
      ? []
      : [
          {
            id: 'category',
            accessorFn: (row) => row.category?.name ?? '',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title='Category' />
            ),
            cell: ({ row }) => <CategoryTag category={row.original.category} />,
            sortingFn: 'text',
          } satisfies ColumnDef<ExpenseWithRelations>,
        ]),
    {
      id: 'note',
      enableSorting: false,
      header: 'Note',
      cell: ({ row }) => (
        <span
          className={cn(
            'block truncate',
            isMobile ? 'max-w-[120px]' : 'max-w-[280px]',
            !row.original.note && 'text-muted-foreground italic'
          )}
          title={row.original.note ?? undefined}
        >
          {row.original.note || '—'}
        </span>
      ),
    },
    {
      id: 'amount',
      accessorFn: (row) =>
        convertToBase(
          Number(row.amount),
          row.currency as CurrencyCode,
          baseCurrency
        ).amount_base,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title='Amount'
          className='w-full justify-end'
        />
      ),
      cell: ({ row }) => (
        <span className='font-medium whitespace-nowrap tabular-nums'>
          {formatCurrency(
            Number(row.original.amount),
            row.original.currency as CurrencyCode
          )}
        </span>
      ),
      sortingFn: 'basic',
      meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
    },
    ...(isMobile
      ? []
      : [
          {
            id: 'actions',
            enableSorting: false,
            header: 'Actions',
            cell: ({ row }) => (
              <div onClick={(event) => event.stopPropagation()}>
                <RowActions
                  editLabel='Edit expense'
                  deleteLabel='Delete expense'
                  onEdit={() => onEdit(row.original)}
                  onDelete={() => onDelete(row.original)}
                  onOpenAttachment={
                    row.original.attachment
                      ? () =>
                          openAttachment(row.original.attachment!.storage_path)
                      : undefined
                  }
                />
              </div>
            ),
            meta: {
              headerClassName: 'w-[120px] text-right',
              cellClassName: 'text-right',
            },
          } satisfies ColumnDef<ExpenseWithRelations>,
        ]),
  ];

  const footer = (
    <TableRow>
      <TableCell colSpan={isMobile ? 2 : 3} className='text-right'>
        Total ({baseCurrency})
      </TableCell>
      <TableCell className='text-right font-semibold whitespace-nowrap tabular-nums'>
        {formatCurrency(total, baseCurrency)}
      </TableCell>
      {!isMobile && <TableCell />}
    </TableRow>
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      onRowClick={onView}
      emptyMessage='No expenses for this range.'
      footer={footer}
      pagination={pagination}
      pageCount={pageCount}
      onPaginationChange={onPaginationChange}
      bordered={bordered}
    />
  );
}
