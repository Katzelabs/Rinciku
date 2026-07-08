import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { CategoryTag } from '@/components/shared/category-tag';
import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/shared/data-table';
import { RowActions } from '@/components/shared/row-actions';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@rinciku/core';
import { convertToBase, type CurrencyCode } from '@rinciku/core';
import { type EssentialWithCategory } from '../api';

type Props = {
  rows: EssentialWithCategory[];
  baseCurrency: CurrencyCode;
  onAdd: () => void;
  onView: (row: EssentialWithCategory) => void;
  onEdit: (row: EssentialWithCategory) => void;
  onDelete: (row: EssentialWithCategory) => void;
  bordered?: boolean;
  isLoading?: boolean;
};

export function EssentialTable({
  rows,
  baseCurrency,
  onAdd,
  onView,
  onEdit,
  onDelete,
  bordered,
  isLoading,
}: Props) {
  const { t } = useTranslation('essentials');
  const columns: ColumnDef<EssentialWithCategory>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.name')} />
      ),
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.name}</span>
      ),
    },
    {
      id: 'category',
      accessorFn: (row) => row.category?.name ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('table.category')} />
      ),
      cell: ({ row }) => <CategoryTag category={row.original.category} />,
      sortingFn: 'text',
    },
    {
      accessorKey: 'notes',
      enableSorting: false,
      header: t('table.notes'),
      cell: ({ row }) =>
        row.original.notes ? (
          <span className='block max-w-[28ch] truncate text-muted-foreground'>
            {row.original.notes}
          </span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
      meta: {
        headerClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
      },
    },
    {
      id: 'amount',
      accessorFn: (row) =>
        convertToBase(
          Number(row.estimated_amount),
          row.currency as CurrencyCode,
          baseCurrency
        ).amount_base,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('table.amount')}
          className='w-full justify-end'
        />
      ),
      cell: ({ row }) => (
        <span className='font-medium whitespace-nowrap tabular-nums'>
          {formatCurrency(
            Number(row.original.estimated_amount),
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
      header: t('table.actions'),
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <RowActions
            editLabel={t('table.editLabel')}
            deleteLabel={t('table.deleteLabel')}
            onEdit={() => onEdit(row.original)}
            onDelete={() => onDelete(row.original)}
          />
        </div>
      ),
      meta: {
        headerClassName: 'w-[120px] text-right',
        cellClassName: 'text-right',
      },
    },
  ];

  const emptyMessage = (
    <div className='space-y-1'>
      <p>{t('table.empty')}</p>
      <Button type='button' variant='link' className='mt-1' onClick={onAdd}>
        {t('table.addFirst')}
      </Button>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage={emptyMessage}
      bordered={bordered}
      isLoading={isLoading}
      onRowClick={onView}
    />
  );
}
