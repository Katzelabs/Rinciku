import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { convertToBase, type CurrencyCode } from '@/lib/fx';
import { useAuth } from '@/features/auth';
import {
  getCurrentCycle,
  getCycleRange,
  type Cycle,
} from '@/features/expenses/lib/cycle';
import {
  deleteIncome,
  listIncomes,
  type IncomeWithRelations,
} from '../api';
import { IncomeFilters } from '../components/income-filters';
import { IncomeForm } from '../components/income-form';
import { IncomeTable } from '../components/income-table';

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; row: IncomeWithRelations }
  | { kind: 'delete'; row: IncomeWithRelations }
  | null;

export function IncomesPage() {
  const { profile } = useAuth();
  const startDay = profile?.month_start_day ?? 1;
  const baseCurrency = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const [cycle, setCycle] = useState<Cycle>(() =>
    getCurrentCycle(new Date(), startDay)
  );
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);
  const [refetchToken, setRefetchToken] = useState(0);

  const fetchKey = `${cycle.year}-${cycle.month}-${startDay}-${refetchToken}`;
  const [response, setResponse] = useState<{
    key: string;
    rows: IncomeWithRelations[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = getCycleRange(cycle.year, cycle.month, startDay);
    listIncomes({ from: from.toISOString(), to: to.toISOString() }).then(
      ({ data, error }) => {
        if (cancelled) return;
        setResponse({
          key: fetchKey,
          rows: data ?? [],
          error: error?.message ?? null,
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [fetchKey, cycle.year, cycle.month, startDay]);

  const loading = response?.key !== fetchKey;
  const error = response?.error ?? null;
  const rows = useMemo(() => response?.rows ?? [], [response]);

  const total = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum +
          convertToBase(
            Number(row.amount),
            row.currency as CurrencyCode,
            baseCurrency
          ).amount_base,
        0
      ),
    [rows, baseCurrency]
  );

  function refetch() {
    setRefetchToken((n) => n + 1);
  }

  async function handleConfirmDelete() {
    if (dialog?.kind !== 'delete') return;
    setDeleting(true);
    const { error } = await deleteIncome(dialog.row.id);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete income.');
      return;
    }
    toast.success('Income deleted');
    setDialog(null);
    refetch();
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>Incomes</h1>
          <p className='text-sm text-muted-foreground'>
            Log received income and keep transfer proofs in one place.
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: 'create' })}>
          <Plus className='size-4' />
          Add income
        </Button>
      </div>

      <IncomeFilters
        cycle={cycle}
        onCycleChange={setCycle}
        startDay={startDay}
      />

      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Spinner />
        </div>
      ) : error ? (
        <div className='rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive'>
          Failed to load incomes: {error}
        </div>
      ) : (
        <IncomeTable
          rows={rows}
          total={total}
          baseCurrency={baseCurrency}
          onEdit={(row) => setDialog({ kind: 'edit', row })}
          onDelete={(row) => setDialog({ kind: 'delete', row })}
        />
      )}

      <Dialog
        open={dialog?.kind === 'create'}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add income</DialogTitle>
            <DialogDescription>
              Log income received in the current cycle.
            </DialogDescription>
          </DialogHeader>
          <IncomeForm
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
            <DialogTitle>Edit income</DialogTitle>
            <DialogDescription>Update the details below.</DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'edit' && (
            <IncomeForm
              mode='edit'
              defaultValues={{
                id: dialog.row.id,
                amount: Number(dialog.row.amount),
                occurred_at: new Date(dialog.row.occurred_at),
                note: dialog.row.note ?? '',
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
            <DialogTitle>Delete income?</DialogTitle>
            <DialogDescription>
              This permanently removes the income. Any linked attachment file
              stays in storage.
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
