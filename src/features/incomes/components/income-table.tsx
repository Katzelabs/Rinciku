import { format } from 'date-fns';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/data-table';
import { RowActions } from '@/components/shared/row-actions';
import { Badge } from '@/components/ui/badge';
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
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[130px]'>Date</TableHead>
          {showSource && <TableHead className='w-[100px]'>Source</TableHead>}
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
            <TableRow key={row.id}>
              <TableCell className='whitespace-nowrap text-muted-foreground'>
                {format(new Date(row.occurred_at), 'd MMM yyyy')}
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
              <TableCell className='text-right font-medium whitespace-nowrap tabular-nums'>
                {formatCurrency(amount, currency)}
              </TableCell>
              <TableCell className='text-right'>
                <RowActions
                  editLabel='Edit income'
                  deleteLabel='Delete income'
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
            <TableCell colSpan={showSource ? 3 : 2} className='text-right'>
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
