import { format } from 'date-fns';
import { toast } from 'sonner';
import { CategoryTag } from '@/components/shared/category-tag';
import { DataTable } from '@/components/shared/data-table';
import { RowActions } from '@/components/shared/row-actions';
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';
import { getAttachmentSignedUrl, type ExpenseWithRelations } from '../api';

type Props = {
  rows: ExpenseWithRelations[];
  total: number;
  baseCurrency: CurrencyCode;
  onView: (row: ExpenseWithRelations) => void;
  onEdit: (row: ExpenseWithRelations) => void;
  onDelete: (row: ExpenseWithRelations) => void;
};

export function ExpenseTable({
  rows,
  total,
  baseCurrency,
  onView,
  onEdit,
  onDelete,
}: Props) {
  async function openAttachment(path: string) {
    const { data, error } = await getAttachmentSignedUrl(path);
    if (error || !data?.signedUrl) {
      toast.error('Could not open the attachment.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[130px]'>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Note</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
          <TableHead className='w-[120px] text-right'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const currency = row.currency as CurrencyCode;
          const amount = Number(row.amount);
          const attachment = row.attachment;
          return (
            <TableRow
              key={row.id}
              onClick={() => onView(row)}
              className='cursor-pointer'
            >
              <TableCell className='whitespace-nowrap text-muted-foreground'>
                {format(new Date(row.occurred_at), 'd MMM yyyy')}
              </TableCell>
              <TableCell>
                <CategoryTag category={row.category} />
              </TableCell>
              <TableCell
                className={cn(
                  'max-w-[280px] truncate',
                  !row.note && 'text-muted-foreground italic'
                )}
                title={row.note ?? undefined}
              >
                {row.note || '—'}
              </TableCell>
              <TableCell className='text-right font-medium whitespace-nowrap tabular-nums'>
                {formatCurrency(amount, currency)}
              </TableCell>
              <TableCell
                className='text-right'
                onClick={(e) => e.stopPropagation()}
              >
                <RowActions
                  editLabel='Edit expense'
                  deleteLabel='Delete expense'
                  onEdit={() => onEdit(row)}
                  onDelete={() => onDelete(row)}
                  onOpenAttachment={
                    attachment
                      ? () => openAttachment(attachment.storage_path)
                      : undefined
                  }
                />
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
              No expenses for this cycle.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      {rows.length > 0 && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className='text-right'>
              Total ({baseCurrency})
            </TableCell>
            <TableCell className='text-right font-semibold whitespace-nowrap tabular-nums'>
              {formatCurrency(total, baseCurrency)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      )}
    </DataTable>
  );
}
