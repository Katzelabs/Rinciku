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
  getIncomeAttachmentSignedUrl,
  type IncomeWithRelations,
} from '../api';

type Props = {
  rows: IncomeWithRelations[];
  total: number;
  baseCurrency: CurrencyCode;
  onEdit: (row: IncomeWithRelations) => void;
  onDelete: (row: IncomeWithRelations) => void;
};

export function IncomeTable({
  rows,
  total,
  baseCurrency,
  onEdit,
  onDelete,
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

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[120px]'>Date</TableHead>
            <TableHead className='text-right'>Amount</TableHead>
            {showSource && <TableHead className='w-[100px]'>Source</TableHead>}
            <TableHead>Note</TableHead>
            <TableHead className='w-[140px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const currency = row.currency as CurrencyCode;
            const amount = Number(row.amount);
            const attachment = row.attachment;
            return (
              <TableRow key={row.id}>
                <TableCell className='whitespace-nowrap text-muted-foreground'>
                  {format(new Date(row.occurred_at), 'd MMM yyyy')}
                </TableCell>
                <TableCell className='text-right whitespace-nowrap'>
                  <div className='font-medium'>
                    {formatCurrency(amount, currency)}
                  </div>
                </TableCell>
                {showSource && (
                  <TableCell>
                    <Badge variant='secondary' className='capitalize'>
                      {row.source}
                    </Badge>
                  </TableCell>
                )}
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
                      aria-label='Edit income'
                      onClick={() => onEdit(row)}
                    >
                      <Pencil className='size-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label='Delete income'
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
                colSpan={showSource ? 5 : 4}
                className='py-10 text-center text-sm text-muted-foreground'
              >
                No incomes for this cycle.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className='text-right'>
                Total ({baseCurrency})
              </TableCell>
              <TableCell className='text-right font-semibold'>
                {formatCurrency(total, baseCurrency)}
              </TableCell>
              {showSource && <TableCell />}
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
