import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

import { AttachmentPreview } from '@/components/shared/attachment-preview';
import { CategoryTag } from '@/components/shared/category-tag';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';

import { getAttachmentSignedUrl, type ExpenseWithRelations } from '../api';

type Props = {
  row: ExpenseWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ExpenseDetailDialog({
  row,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Expense details</DialogTitle>
          <DialogDescription>
            Review this expense, then edit or delete it.
          </DialogDescription>
        </DialogHeader>

        {row && (
          <div className='space-y-5'>
            <div className='flex items-end justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3'>
              <div className='space-y-0.5'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Amount
                </p>
                <p className='text-2xl font-semibold tabular-nums'>
                  {formatCurrency(
                    Number(row.amount),
                    row.currency as CurrencyCode
                  )}
                </p>
              </div>
              <p className='pb-1 text-sm text-muted-foreground'>
                {format(new Date(row.occurred_at), 'd MMM yyyy')}
              </p>
            </div>

            <dl className='space-y-3'>
              <Row label='Category'>
                <CategoryTag category={row.category} />
              </Row>
              <Row label='Note' align='start'>
                {row.note ? (
                  <span className='whitespace-pre-wrap break-words'>
                    {row.note}
                  </span>
                ) : (
                  <span className='text-muted-foreground italic'>No note</span>
                )}
              </Row>
            </dl>

            <div className='space-y-2'>
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Receipt
              </p>
              {row.attachment ? (
                <AttachmentPreview
                  key={row.attachment.storage_path}
                  variant='full'
                  storagePath={row.attachment.storage_path}
                  mimeType={row.attachment.mime_type}
                  getSignedUrl={getAttachmentSignedUrl}
                />
              ) : (
                <p className='text-sm text-muted-foreground italic'>
                  No attachment
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className='sm:justify-between'>
          <Button
            variant='ghost'
            onClick={onDelete}
            className='text-destructive hover:bg-destructive/10 hover:text-destructive'
          >
            <Trash2 className='size-4' />
            Delete
          </Button>
          <Button onClick={onEdit}>
            <Pencil className='size-4' />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  children,
  align = 'center',
}: {
  label: string;
  children: ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        align === 'start' ? 'items-start' : 'items-center'
      }`}
    >
      <dt className='shrink-0 text-sm text-muted-foreground'>{label}</dt>
      <dd className='min-w-0 text-right text-sm font-medium'>{children}</dd>
    </div>
  );
}
