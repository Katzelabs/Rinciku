import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { PaginationState } from '@tanstack/react-table';
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
import { Spinner } from '@/components/ui/spinner';
import type { DateRangeValue } from '@/components/shared/date-range-picker';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { convertToBase, ensureRates, type CurrencyCode } from '@/lib/fx';
import { useAuth } from '@/features/auth';
import {
  deleteAttachmentObject,
  deleteExpense,
  listExpenses,
  sumExpenses,
  type ExpenseWithRelations,
} from '../api';
import { ExpenseDetailDialog } from '../components/expense-detail-dialog';
import { ExpenseFilters } from '../components/expense-filters';
import { ExpenseForm } from '../components/expense-form';
import { ExpenseTable } from '../components/expense-table';
import { getCurrentCycle, getCycleRange } from '../lib/cycle';

const DEFAULT_PAGE_SIZE = 10;

type DialogState =
  | { kind: 'create' }
  | { kind: 'view'; row: ExpenseWithRelations }
  | { kind: 'edit'; row: ExpenseWithRelations }
  | { kind: 'delete'; row: ExpenseWithRelations }
  | null;

export function ExpensesPage() {
  const { profile } = useAuth();
  const startDay = profile?.month_start_day ?? 1;
  const baseCurrency = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const [customRange, setCustomRange] = useState<DateRangeValue | null>(null);
  const [search, setSearch] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);
  const [refetchToken, setRefetchToken] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { pageIndex, pageSize } = pagination;
  // Default to the current billing cycle until the user picks a custom range.
  const cycle = getCurrentCycle(new Date(), startDay);
  const dateRange =
    customRange ?? getCycleRange(cycle.year, cycle.month, startDay);
  const fromIso = dateRange.from.toISOString();
  const toIso = dateRange.to.toISOString();

  const fetchKey = `${fromIso}|${toIso}|${categoryIds.join(',')}|${debouncedSearch}|${pageIndex}|${pageSize}|${baseCurrency}|${refetchToken}`;
  const [response, setResponse] = useState<{
    key: string;
    rows: ExpenseWithRelations[];
    count: number;
    total: number;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureRates()
      .then(() =>
        Promise.all([
          listExpenses({
            from: fromIso,
            to: toIso,
            categoryIds,
            search: debouncedSearch,
            limit: pageSize,
            offset: pageIndex * pageSize,
          }),
          sumExpenses({
            from: fromIso,
            to: toIso,
            categoryIds,
            search: debouncedSearch,
          }),
        ])
      )
      .then(([listRes, sumRes]) => {
        if (cancelled) return;
        const amounts = sumRes.data ?? [];
        const total = amounts.reduce(
          (sum, row) =>
            sum +
            convertToBase(
              Number(row.amount),
              row.currency as CurrencyCode,
              baseCurrency
            ).amount_base,
          0
        );
        setResponse({
          key: fetchKey,
          rows: listRes.data ?? [],
          // The sum query returns every matching row, so its length is the
          // exact filtered total — PostgREST's `count` is null for selects
          // with embedded relations, so we can't rely on listRes.count.
          count: sumRes.data ? amounts.length : (listRes.count ?? 0),
          total: Math.round(total * 100) / 100,
          error: listRes.error?.message ?? sumRes.error?.message ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fromIso,
    toIso,
    categoryIds,
    debouncedSearch,
    pageIndex,
    pageSize,
    baseCurrency,
    refetchToken,
  ]);

  const loading = response?.key !== fetchKey;
  const error = response?.error ?? null;
  const rows = response?.rows ?? [];
  const total = response?.total ?? 0;
  const pageCount = Math.ceil((response?.count ?? 0) / pageSize);

  function resetToFirstPage() {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  function refetch() {
    setRefetchToken((n) => n + 1);
  }

  async function handleConfirmDelete() {
    if (dialog?.kind !== 'delete') return;
    const { row } = dialog;
    setDeleting(true);
    const { error } = await deleteExpense(row.id);
    // Deleting the expense cascade-deletes the attachment row; the storage
    // object is not cascaded, so remove it here to avoid orphaned files.
    if (!error && row.attachment) {
      await deleteAttachmentObject(row.attachment.storage_path);
    }
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
            Log and review your spending for the selected range.
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: 'create' })}>
          <Plus className='size-4' />
          Add expense
        </Button>
      </div>

      <Card className='gap-0 py-0'>
        <div className='border-b p-4 sm:p-5'>
          <ExpenseFilters
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              resetToFirstPage();
            }}
            categoryIds={categoryIds}
            onCategoryIdsChange={(value) => {
              setCategoryIds(value);
              resetToFirstPage();
            }}
            dateRange={dateRange}
            onDateRangeChange={(value) => {
              setCustomRange(value);
              resetToFirstPage();
            }}
          />
        </div>
        <div className='p-4 sm:p-5'>
          {error ? (
            <div className='rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive'>
              Failed to load expenses: {error}
            </div>
          ) : (
            <ExpenseTable
              rows={rows}
              total={total}
              baseCurrency={baseCurrency}
              isLoading={loading}
              pagination={pagination}
              pageCount={pageCount}
              onPaginationChange={setPagination}
              onView={(row) => setDialog({ kind: 'view', row })}
              onEdit={(row) => setDialog({ kind: 'edit', row })}
              onDelete={(row) => setDialog({ kind: 'delete', row })}
              bordered={false}
            />
          )}
        </div>
      </Card>

      <ExpenseDetailDialog
        row={dialog?.kind === 'view' ? dialog.row : null}
        open={dialog?.kind === 'view'}
        onOpenChange={(open) => !open && setDialog(null)}
        onEdit={() =>
          dialog?.kind === 'view' &&
          setDialog({ kind: 'edit', row: dialog.row })
        }
        onDelete={() =>
          dialog?.kind === 'view' &&
          setDialog({ kind: 'delete', row: dialog.row })
        }
      />

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
              existingAttachment={
                dialog.row.attachment
                  ? {
                      id: dialog.row.attachment.id,
                      storage_path: dialog.row.attachment.storage_path,
                      mime_type: dialog.row.attachment.mime_type,
                    }
                  : null
              }
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
              This permanently removes the expense and any attached receipt.
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
