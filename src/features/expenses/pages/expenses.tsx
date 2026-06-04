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
import { useAuth } from '@/features/auth';
import type { CategoryTier } from '@/features/categories/hooks/use-categories';
import {
  deleteExpense,
  listExpenses,
  type ExpenseWithRelations,
} from '../api';
import { ExpenseFilters } from '../components/expense-filters';
import { ExpenseForm } from '../components/expense-form';
import { ExpenseTable } from '../components/expense-table';
import {
  getCurrentCycle,
  getCycleRange,
  type Cycle,
} from '../lib/cycle';

const ALL_TIERS: CategoryTier[] = ['fixed', 'needs', 'wants'];

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; row: ExpenseWithRelations }
  | { kind: 'delete'; row: ExpenseWithRelations }
  | null;

export function ExpensesPage() {
  const { profile } = useAuth();
  const startDay = profile?.month_start_day ?? 1;

  const [cycle, setCycle] = useState<Cycle>(() =>
    getCurrentCycle(new Date(), startDay)
  );
  const [tiers, setTiers] = useState<Set<CategoryTier>>(
    () => new Set(ALL_TIERS)
  );
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);
  const [refetchToken, setRefetchToken] = useState(0);

  const fetchKey = `${cycle.year}-${cycle.month}-${startDay}-${refetchToken}`;
  const [response, setResponse] = useState<{
    key: string;
    rows: ExpenseWithRelations[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = getCycleRange(cycle.year, cycle.month, startDay);
    listExpenses({ from: from.toISOString(), to: to.toISOString() }).then(
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

  const filteredRows = useMemo(() => {
    const rows = response?.rows ?? [];
    if (tiers.size === 0) return rows;
    return rows.filter((row) => {
      if (!row.category) return true;
      return tiers.has(row.category.tier as CategoryTier);
    });
  }, [response, tiers]);

  const totalIdr = useMemo(
    () =>
      filteredRows.reduce((sum, row) => sum + Number(row.amount_idr ?? 0), 0),
    [filteredRows]
  );

  function refetch() {
    setRefetchToken((n) => n + 1);
  }

  async function handleConfirmDelete() {
    if (dialog?.kind !== 'delete') return;
    setDeleting(true);
    const { error } = await deleteExpense(dialog.row.id);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete expense.');
      return;
    }
    toast.success('Expense deleted');
    setDialog(null);
    refetch();
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>Expenses</h1>
          <p className='text-sm text-muted-foreground'>
            Log and review your spending for this cycle.
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: 'create' })}>
          <Plus className='size-4' />
          Add expense
        </Button>
      </div>

      <ExpenseFilters
        cycle={cycle}
        onCycleChange={setCycle}
        startDay={startDay}
        tiers={tiers}
        onTiersChange={setTiers}
      />

      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Spinner />
        </div>
      ) : error ? (
        <div className='rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive'>
          Failed to load expenses: {error}
        </div>
      ) : (
        <ExpenseTable
          rows={filteredRows}
          totalIdr={totalIdr}
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
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>
              Log a new expense for the current cycle.
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
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
            <DialogTitle>Edit expense</DialogTitle>
            <DialogDescription>Update the details below.</DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'edit' && (
            <ExpenseForm
              mode='edit'
              defaultValues={{
                id: dialog.row.id,
                amount: Number(dialog.row.amount),
                currency: dialog.row.currency as 'IDR' | 'USD',
                category_id: dialog.row.category_id ?? '',
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
            <DialogTitle>Delete expense?</DialogTitle>
            <DialogDescription>
              This permanently removes the expense. Any linked attachment file
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
