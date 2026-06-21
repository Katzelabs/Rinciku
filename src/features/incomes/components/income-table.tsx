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
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { convertToBase, type CurrencyCode } from '@/lib/fx';
import { getIncomeAttachmentSignedUrl, type IncomeWithRelations } from '../api';

type Props = {
  rows: IncomeWithRelations[];
  total: number;
  baseCurrency: CurrencyCode;
  isLoading?: boolean;
  pagination: PaginationState;
  pageCount: number;
  onPaginationChange: OnChangeFn<PaginationState>;
  onView: (row: IncomeWithRelations) => void;
  onEdit: (row: IncomeWithRelations) => void;
  onDelete: (row: IncomeWithRelations) => void;
  bordered?: boolean;
};

export function IncomeTable({
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
  const showSource = rows.some((row) => row.source !== 'manual');

  async function openAttachment(path: string) {
    const { data, error } = await getIncomeAttachmentSignedUrl(path);
    if (error || !data?.signedUrl) {
      toast.error('Could not open the attachment.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  const sourceColumn: ColumnDef<IncomeWithRelations> = {
    id: 'source',
    enableSorting: false,
    header: 'Source',
    cell: ({ row }) => (
      <Badge variant='secondary' className='capitalize'>
        {row.original.source}
      </Badge>
    ),
    meta: { headerClassName: 'w-[100px]' },
  };

  const columns: ColumnDef<IncomeWithRelations>[] = [
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
    {
      id: 'category',
      accessorFn: (row) => row.category?.name ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Category' />
      ),
      cell: ({ row }) => <CategoryTag category={row.original.category} />,
      sortingFn: 'text',
    },
    ...(showSource ? [sourceColumn] : []),
    {
      id: 'note',
      enableSorting: false,
      header: 'Note',
      cell: ({ row }) => (
        <span
          className={cn(
            'block max-w-[280px] truncate',
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
    {
      id: 'actions',
      enableSorting: false,
      header: 'Actions',
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <RowActions
            editLabel='Edit income'
            deleteLabel='Delete income'
            onEdit={() => onEdit(row.original)}
            onDelete={() => onDelete(row.original)}
            onOpenAttachment={
              row.original.attachment
                ? () => openAttachment(row.original.attachment!.storage_path)
                : undefined
            }
          />
        </div>
      ),
      meta: {
        headerClassName: 'w-[120px] text-right',
        cellClassName: 'text-right',
      },
    },
  ];

  const footer = (
    <TableRow>
      <TableCell colSpan={showSource ? 4 : 3} className='text-right'>
        Total ({baseCurrency})
      </TableCell>
      <TableCell className='text-right font-semibold whitespace-nowrap tabular-nums'>
        {formatCurrency(total, baseCurrency)}
      </TableCell>
      <TableCell />
    </TableRow>
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      onRowClick={onView}
      emptyMessage='No incomes for this range.'
      footer={footer}
      pagination={pagination}
      pageCount={pageCount}
      onPaginationChange={onPaginationChange}
      bordered={bordered}
    />
  );
}
