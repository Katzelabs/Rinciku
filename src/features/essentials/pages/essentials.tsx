import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CurrencyCode } from '@/lib/fx';
import { useAuth } from '@/features/auth';
import {
  deleteEssential,
  listEssentials,
  type EssentialWithCategory,
} from '../api';
import { EssentialForm } from '../components/essential-form';
import { EssentialTable } from '../components/essential-table';
import { MonthlyBaselineSummary } from '../components/monthly-baseline-summary';

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; row: EssentialWithCategory }
  | { kind: 'delete'; row: EssentialWithCategory }
  | null;

export function EssentialsPage() {
  const { profile } = useAuth();
  const baseCurrency = (profile?.base_currency ?? 'IDR') as CurrencyCode;
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);
  const [refetchToken, setRefetchToken] = useState(0);

  const fetchKey = `${refetchToken}`;
  const [response, setResponse] = useState<{
    key: string;
    rows: EssentialWithCategory[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    listEssentials().then(({ data, error }) => {
      if (cancelled) return;
      setResponse({
        key: fetchKey,
        rows: data ?? [],
        error: error?.message ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const loading = response?.key !== fetchKey;
  const error = response?.error ?? null;
  const rows = response?.rows ?? [];

  function refetch() {
    setRefetchToken((n) => n + 1);
  }

  async function handleConfirmDelete() {
    if (dialog?.kind !== 'delete') return;
    setDeleting(true);
    const { error } = await deleteEssential(dialog.row.id);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete essential.');
      return;
    }
    toast.success('Essential deleted');
    setDialog(null);
    refetch();
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>Essentials</h1>
          <p className='text-sm text-muted-foreground'>
            Your monthly non-negotiables. The total powers the baseline the AI
            consults against.
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: 'create' })}>
          <Plus className='size-4' />
          Add essential
        </Button>
      </div>

      <Card className='gap-0 py-0'>
        <div className='p-4 sm:p-5'>
          {loading ? (
            <EssentialTableSkeleton />
          ) : error ? (
            <div className='rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive'>
              Failed to load essentials: {error}
            </div>
          ) : (
            <EssentialTable
              rows={rows}
              baseCurrency={baseCurrency}
              onAdd={() => setDialog({ kind: 'create' })}
              onEdit={(row) => setDialog({ kind: 'edit', row })}
              onDelete={(row) => setDialog({ kind: 'delete', row })}
              bordered={false}
            />
          )}
        </div>
        <div className='border-t p-4 sm:p-5'>
          <MonthlyBaselineSummary variant='footer' refreshKey={refetchToken} />
        </div>
      </Card>

      <Dialog
        open={dialog?.kind === 'create'}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add essential</DialogTitle>
            <DialogDescription>
              Add a new monthly line item to your baseline.
            </DialogDescription>
          </DialogHeader>
          <EssentialForm
            mode='create'
            onSuccess={() => {
              setDialog(null);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog?.kind === 'edit'}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Edit essential</DialogTitle>
            <DialogDescription>Update the details below.</DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'edit' && (
            <EssentialForm
              mode='edit'
              defaultValues={{
                id: dialog.row.id,
                name: dialog.row.name,
                estimated_amount: Number(dialog.row.estimated_amount),
                currency: dialog.row.currency as CurrencyCode,
                category_id: dialog.row.category_id ?? '',
                notes: '',
              }}
              onSuccess={() => {
                setDialog(null);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog?.kind === 'delete'}
        onOpenChange={(open) => !open && !deleting && setDialog(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete essential?</DialogTitle>
            <DialogDescription>
              This permanently removes the essential from your baseline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDialog(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting && <Spinner data-icon='inline-start' />}
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EssentialTableSkeleton() {
  return (
    <div>
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
          {[0, 1, 2].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className='h-4 w-32' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-28' />
              </TableCell>
              <TableCell className='text-right'>
                <Skeleton className='ml-auto h-4 w-20' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-16' />
              </TableCell>
              <TableCell className='text-right'>
                <Skeleton className='ml-auto h-4 w-16' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
