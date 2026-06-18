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
import { supabase } from '@/lib/supabase';
import { ensureRates, getCurrentRates, type CurrencyCode } from '@/lib/fx';
import { useAuth } from '@/features/auth';
import { useTiers } from '@/features/categories/hooks/use-categories';
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

type MonthlyTotals = {
  spent_total: number;
  by_tier: Record<string, number>;
  uncategorized_spent: number;
};

const EMPTY_TOTALS: MonthlyTotals = {
  spent_total: 0,
  by_tier: {},
  uncategorized_spent: 0,
};

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; row: ExpenseWithRelations }
  | { kind: 'delete'; row: ExpenseWithRelations }
  | null;

export function ExpensesPage() {
  const { profile } = useAuth();
  const startDay = profile?.month_start_day ?? 1;
  const baseCurrency = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const { data: availableTiers } = useTiers();
  const [cycle, setCycle] = useState<Cycle>(() =>
    getCurrentCycle(new Date(), startDay)
  );
  // Empty set means "no filter" — show every tier.
  const [selectedTierIds, setSelectedTierIds] = useState<Set<string>>(
    () => new Set()
  );
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);
  const [refetchToken, setRefetchToken] = useState(0);

  const fetchKey = `${cycle.year}-${cycle.month}-${startDay}-${baseCurrency}-${refetchToken}`;
  const [response, setResponse] = useState<{
    key: string;
    rows: ExpenseWithRelations[];
    totals: MonthlyTotals;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = getCycleRange(cycle.year, cycle.month, startDay);
    // listExpenses uses .lte(occurred_at, to) so `to` is the inclusive last
    // instant. The RPC window is half-open [start, end), so pass `to + 1ms`
    // as p_end_at to keep both queries over the same set of rows.
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    const endExclusiveIso = new Date(to.getTime() + 1).toISOString();

    ensureRates()
      .then(() =>
        Promise.all([
          listExpenses({ from: fromIso, to: toIso }),
          supabase
            .rpc('dashboard_monthly_summary', {
              p_start_at: fromIso,
              p_end_at: endExclusiveIso,
              p_base: baseCurrency,
              p_rates: getCurrentRates(),
            })
            .single(),
        ])
      )
      .then(([listRes, summaryRes]) => {
      if (cancelled) return;
      const errorMessage =
        listRes.error?.message ?? summaryRes.error?.message ?? null;
      const totals: MonthlyTotals = summaryRes.data
        ? {
            spent_total: Number(summaryRes.data.spent_total ?? 0),
            by_tier: parseTierTotals(summaryRes.data.by_tier),
            uncategorized_spent: Number(
              summaryRes.data.uncategorized_spent ?? 0
            ),
          }
        : EMPTY_TOTALS;
      setResponse({
        key: fetchKey,
        rows: listRes.data ?? [],
        totals,
        error: errorMessage,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, cycle.year, cycle.month, startDay, baseCurrency]);

  const loading = response?.key !== fetchKey;
  const error = response?.error ?? null;

  const filteredRows = useMemo(() => {
    const rows = response?.rows ?? [];
    if (selectedTierIds.size === 0) return rows;
    return rows.filter((row) => {
      const tierId = row.category?.tier_id ?? null;
      // Rows with no tier (uncategorized or untiered) always show.
      if (!tierId) return true;
      return selectedTierIds.has(tierId);
    });
  }, [response, selectedTierIds]);

  const total = useMemo(() => {
    const totals = response?.totals ?? EMPTY_TOTALS;
    if (selectedTierIds.size === 0) return round2(totals.spent_total);
    // Untiered/uncategorized rows always appear in the filtered list (see
    // filteredRows above), so they always contribute to the total.
    let sum = totals.uncategorized_spent;
    for (const tierId of selectedTierIds) {
      sum += totals.by_tier[tierId] ?? 0;
    }
    return round2(sum);
  }, [response, selectedTierIds]);

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
        availableTiers={availableTiers ?? []}
        selectedTierIds={selectedTierIds}
        onTiersChange={setSelectedTierIds}
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
                currency: dialog.row.currency as CurrencyCode,
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

// The SQL function returns by_tier as a jsonb map { tier_id: amount }.
function parseTierTotals(raw: unknown): Record<string, number> {
  const totals: Record<string, number> = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [tierId, amount] of Object.entries(raw)) {
      totals[tierId] = Number(amount ?? 0);
    }
  }
  return totals;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
