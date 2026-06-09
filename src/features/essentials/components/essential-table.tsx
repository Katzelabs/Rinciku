import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
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
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className='text-right'>Amount</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className='w-[120px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const currency = row.currency as CurrencyCode;
            const amount = Number(row.estimated_amount);
            const category = row.category;
            return (
              <TableRow key={row.id}>
                <TableCell className='font-medium'>{row.name}</TableCell>
                <TableCell>
                  {category ? (
                    <div className='flex items-center gap-2'>
                      <span
                        aria-hidden
                        className='inline-flex size-6 items-center justify-center rounded-full text-[10px] font-semibold uppercase text-white'
                        style={{
                          backgroundColor: category.color ?? '#94a3b8',
                        }}
                      >
                        {category.name.charAt(0)}
                      </span>
                      <span>{category.name}</span>
                      <Badge variant='secondary' className='capitalize'>
                        {category.tier}
                      </Badge>
                    </div>
                  ) : (
                    <span className='text-muted-foreground italic'>
                      Uncategorized
                    </span>
                  )}
                </TableCell>
                <TableCell className='text-right font-medium whitespace-nowrap'>
                  {formatCurrency(amount, currency)}
                </TableCell>
                <TableCell className='text-muted-foreground italic'>
                  —
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-1'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label='Edit essential'
                      onClick={() => onEdit(row)}
                    >
                      <Pencil className='size-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label='Delete essential'
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
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
      </Table>
    </div>
  );
}
