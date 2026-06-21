import { useEffect, useState } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
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
import { getCurrentCycle, getCycleRange } from '@/features/expenses/lib/cycle';
import {
  deleteIncome,
  deleteIncomeAttachmentObject,
  listIncomes,
  sumIncomes,
  type IncomeWithRelations,
} from '../api';
import { IncomeDetailDialog } from '../components/income-detail-dialog';
import { IncomeExportDialog } from '../components/income-export-dialog';
import { IncomeFilters } from '../components/income-filters';
import { IncomeForm } from '../components/income-form';
import { IncomeImportDialog } from '../components/income-import-dialog';
import { IncomeTable } from '../components/income-table';

const DEFAULT_PAGE_SIZE = 10;

type DialogState =
  | { kind: 'create' }
  | { kind: 'export' }
  | { kind: 'import' }
  | { kind: 'view'; row: IncomeWithRelations }
  | { kind: 'edit'; row: IncomeWithRelations }
  | { kind: 'delete'; row: IncomeWithRelations }
  | null;

export function IncomesPage() {
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
    rows: IncomeWithRelations[];
    count: number;
    total: number;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureRates()
      .then(() =>
        Promise.all([
          listIncomes({
            from: fromIso,
            to: toIso,
            categoryIds,
            search: debouncedSearch,
            limit: pageSize,
            offset: pageIndex * pageSize,
          }),
          sumIncomes({
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
    const { error } = await deleteIncome(row.id);
    // Deleting the income cascade-deletes the attachment row; the storage
    // object is not cascaded, so remove it here to avoid orphaned files.
    if (!error && row.attachment) {
      await deleteIncomeAttachmentObject(row.attachment.storage_path);
    }
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
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Incomes</h1>
          <p className='text-sm text-muted-foreground'>
            Log received income and keep transfer proofs in one place.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => setDialog({ kind: 'export' })}
            aria-label='Export CSV'
            title='Export CSV'
            className='w-9 px-0 sm:w-auto sm:px-4'
          >
            <Download className='size-4' />
            <span className='hidden sm:inline'>Export</span>
          </Button>
          <Button
            variant='outline'
            onClick={() => setDialog({ kind: 'import' })}
            aria-label='Import CSV'
            title='Import CSV'
            className='w-9 px-0 sm:w-auto sm:px-4'
          >
            <Upload className='size-4' />
            <span className='hidden sm:inline'>Import</span>
          </Button>
          <Button
            className='flex-1 sm:flex-none'
            onClick={() => setDialog({ kind: 'create' })}
          >
            <Plus className='size-4' />
            Add income
          </Button>
        </div>
      </div>

      <Card className='gap-0 py-0'>
        <div className='border-b p-4 sm:p-5'>
          <IncomeFilters
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
              Failed to load incomes: {error}
            </div>
          ) : (
            <IncomeTable
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

      <IncomeDetailDialog
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

      <IncomeExportDialog
        open={dialog?.kind === 'export'}
        onOpenChange={(open) => !open && setDialog(null)}
      />

      <IncomeImportDialog
        open={dialog?.kind === 'import'}
        onOpenChange={(open) => !open && setDialog(null)}
        onImported={() => {
          setDialog(null);
          refetch();
        }}
      />

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
                source_id: dialog.row.source_id ?? '',
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
            <DialogTitle>Delete income?</DialogTitle>
            <DialogDescription>
              This permanently removes the income and any attached proof.
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
