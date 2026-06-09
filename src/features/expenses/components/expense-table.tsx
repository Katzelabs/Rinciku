import { format } from 'date-fns';
import { Paperclip, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
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
import {
  getAttachmentSignedUrl,
  type ExpenseWithRelations,
} from '../api';

type Props = {
  rows: ExpenseWithRelations[];
  total: number;
  baseCurrency: CurrencyCode;
  onEdit: (row: ExpenseWithRelations) => void;
  onDelete: (row: ExpenseWithRelations) => void;
};

export function ExpenseTable({
  rows,
  total,
  baseCurrency,
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
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[120px]'>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className='text-right'>Amount</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className='w-[140px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const currency = row.currency as CurrencyCode;
            const amount = Number(row.amount);
            const category = row.category;
            const attachment = row.attachment;
            return (
              <TableRow key={row.id}>
                <TableCell className='whitespace-nowrap text-muted-foreground'>
                  {format(new Date(row.occurred_at), 'd MMM yyyy')}
                </TableCell>
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
                      <span className='font-medium'>{category.name}</span>
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
                <TableCell className='text-right whitespace-nowrap'>
                  <div className='font-medium'>
                    {formatCurrency(amount, currency)}
                  </div>
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
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-1'>
                    {attachment ? (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        aria-label='Open attachment'
                        onClick={() => openAttachment(attachment.storage_path)}
                      >
                        <Paperclip className='size-4' />
                      </Button>
                    ) : null}
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label='Edit expense'
                      onClick={() => onEdit(row)}
                    >
                      <Pencil className='size-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label='Delete expense'
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
                No expenses for this cycle.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className='text-right'>
                Total ({baseCurrency})
              </TableCell>
              <TableCell className='text-right font-semibold'>
                {formatCurrency(total, baseCurrency)}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
