import { CategoryTag } from '@/components/shared/category-tag';
import { DataTable } from '@/components/shared/data-table';
import { RowActions } from '@/components/shared/row-actions';
import { Button } from '@/components/ui/button';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';
import { type EssentialWithCategory } from '../api';

type Props = {
  rows: EssentialWithCategory[];
  onAdd: () => void;
  onEdit: (row: EssentialWithCategory) => void;
  onDelete: (row: EssentialWithCategory) => void;
};

export function EssentialTable({ rows, onAdd, onEdit, onDelete }: Props) {
  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
          <TableHead className='w-[120px] text-right'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const currency = row.currency as CurrencyCode;
          const amount = Number(row.estimated_amount);
          return (
            <TableRow key={row.id}>
              <TableCell className='font-medium'>{row.name}</TableCell>
              <TableCell>
                <CategoryTag category={row.category} />
              </TableCell>
              <TableCell className='text-right font-medium whitespace-nowrap tabular-nums'>
                {formatCurrency(amount, currency)}
              </TableCell>
              <TableCell className='text-right'>
                <RowActions
                  editLabel='Edit essential'
                  deleteLabel='Delete essential'
                  onEdit={() => onEdit(row)}
                  onDelete={() => onDelete(row)}
                />
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={4}
              className='py-10 text-center text-sm text-muted-foreground'
            >
              <p>No essentials yet.</p>
              <Button
                type='button'
                variant='link'
                className='mt-1'
                onClick={onAdd}
              >
                Add your first essential
              </Button>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </DataTable>
  );
}
