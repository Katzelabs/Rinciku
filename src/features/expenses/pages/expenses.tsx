import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
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
import {
  deleteAttachmentObject,
  deleteExpense,
  listExpenses,
  sumExpenses,
  type ExpenseWithRelations,
} from '../api';
import { ExpenseExportDialog } from '../components/expense-export-dialog';
import { ExpenseFilters } from '../components/expense-filters';
import { ExpenseForm } from '../components/expense-form';
import { ExpenseImportDialog } from '../components/expense-import-dialog';
import { ExpenseSummary } from '../components/expense-summary';
import { ExpenseTable } from '../components/expense-table';
import { getCurrentCycle, getCycleRange } from '../lib/cycle';

const DEFAULT_PAGE_SIZE = 10;
const MS_PER_DAY = 86_400_000;

type DialogState =
  | { kind: 'create' }
  | { kind: 'export' }
  | { kind: 'import' }
  | { kind: 'delete'; row: ExpenseWithRelations }
  | null;

export function ExpensesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('expenses');
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
  const count = response?.count ?? 0;
  const pageCount = Math.ceil(count / pageSize);
  const days = Math.max(
    1,
    Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / MS_PER_DAY)
  );

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
      toast.error(t('toast.deleteError'));
      return;
    }
    toast.success(t('toast.deleted'));
    setDialog(null);
    refetch();
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>{t('page.title')}</h1>
          <p className='text-sm text-muted-foreground'>{t('page.subtitle')}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => setDialog({ kind: 'export' })}
            aria-label={t('page.exportCsv')}
            title={t('page.exportCsv')}
            className='w-9 px-0 sm:w-auto sm:px-4'
          >
            <Download className='size-4' />
            <span className='hidden sm:inline'>{t('page.export')}</span>
          </Button>
          <Button
            variant='outline'
            onClick={() => setDialog({ kind: 'import' })}
            aria-label={t('page.importCsv')}
            title={t('page.importCsv')}
            className='w-9 px-0 sm:w-auto sm:px-4'
          >
            <Upload className='size-4' />
            <span className='hidden sm:inline'>{t('page.import')}</span>
          </Button>
          <Button
            className='flex-1 sm:flex-none'
            onClick={() => setDialog({ kind: 'create' })}
          >
            <Plus className='size-4' />
            {t('page.addExpense')}
          </Button>
        </div>
      </div>

      <ExpenseSummary
        total={total}
        count={count}
        days={days}
        baseCurrency={baseCurrency}
        loading={loading}
      />

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
              {t('page.loadError', { error })}
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
              onView={(row) =>
                navigate(`/expenses/${row.id}`, { state: { row } })
              }
              onEdit={(row) =>
                navigate(`/expenses/${row.id}/edit`, { state: { row } })
              }
              onDelete={(row) => setDialog({ kind: 'delete', row })}
              bordered={false}
            />
          )}
        </div>
      </Card>

      <Outlet
        context={{
          refetch,
          requestDelete: (row: ExpenseWithRelations) =>
            setDialog({ kind: 'delete', row }),
        }}
      />

      <ExpenseExportDialog
        open={dialog?.kind === 'export'}
        onOpenChange={(open) => !open && setDialog(null)}
      />

      <ExpenseImportDialog
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
            <DialogTitle>{t('page.addExpense')}</DialogTitle>
            <DialogDescription>{t('page.createDescription')}</DialogDescription>
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
        open={dialog?.kind === 'delete'}
        onOpenChange={(open) => !open && !deleting && setDialog(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('page.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('page.deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDialog(null)}
              disabled={deleting}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting && <Spinner data-icon='inline-start' />}
              {deleting ? t('page.deleting') : t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
