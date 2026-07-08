import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { CategoryTag } from '@/components/shared/category-tag';
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
import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import {
  deleteEssential,
  listEssentials,
  type EssentialWithCategory,
} from '@/features/essentials/api';
import { EssentialForm } from '@/features/essentials/components/essential-form';
import { MonthlyBaselineSummary } from '@/features/essentials/components/monthly-baseline-summary';

type DialogState =
  | { kind: 'create' }
  | { kind: 'delete'; row: EssentialWithCategory }
  | null;

type FetchResponse = {
  key: number;
  rows: EssentialWithCategory[];
  error: string | null;
};

// Essentials capture reused inside the onboarding wizard. Mirrors the Essentials
// page (same refetch + create dialog + baseline footer), trimmed of the page
// header and row navigation. Each row persists immediately via the shared
// EssentialForm — skipping the step just advances without touching added rows.
export function EssentialsReviewStep() {
  const { t } = useTranslation('essentials');
  const [refetchToken, setRefetchToken] = useState(0);
  const [response, setResponse] = useState<FetchResponse | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listEssentials().then(({ data, error }) => {
      if (cancelled) return;
      setResponse({
        key: refetchToken,
        rows: data ?? [],
        error: error?.message ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  const loading = response?.key !== refetchToken;
  const rows = response?.rows ?? [];
  const error = response?.error ?? null;

  function refetch() {
    setRefetchToken((n) => n + 1);
  }

  async function handleConfirmDelete() {
    if (dialog?.kind !== 'delete') return;
    setDeleting(true);
    const { error } = await deleteEssential(dialog.row.id);
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
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button size='sm' onClick={() => setDialog({ kind: 'create' })}>
          <Plus className='size-4' />
          {t('page.addButton')}
        </Button>
      </div>

      {error && (
        <div className='rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          {error}
        </div>
      )}

      <Card className='gap-0 py-0'>
        <div className='p-4 sm:p-5'>
          {loading ? (
            <EssentialRowSkeletons />
          ) : rows.length === 0 ? (
            <div className='space-y-1 py-6 text-center text-sm text-muted-foreground'>
              <p>{t('table.empty')}</p>
              <Button
                type='button'
                variant='link'
                onClick={() => setDialog({ kind: 'create' })}
              >
                {t('table.addFirst')}
              </Button>
            </div>
          ) : (
            <ul className='divide-y'>
              {rows.map((row) => (
                <li
                  key={row.id}
                  className='flex items-center justify-between gap-3 py-2'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{row.name}</p>
                    <CategoryTag category={row.category} />
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='whitespace-nowrap text-sm font-medium tabular-nums'>
                      {formatCurrency(
                        Number(row.estimated_amount),
                        row.currency as CurrencyCode
                      )}
                    </span>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setDialog({ kind: 'delete', row })}
                      aria-label={t('table.deleteLabel')}
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
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
            <DialogTitle>{t('dialog.create.title')}</DialogTitle>
            <DialogDescription>
              {t('dialog.create.description')}
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
        open={dialog?.kind === 'delete'}
        onOpenChange={(open) => !open && !deleting && setDialog(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('dialog.delete.title')}</DialogTitle>
            <DialogDescription>
              {t('dialog.delete.description')}
            </DialogDescription>
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
              {deleting
                ? t('dialog.delete.deleting')
                : t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EssentialRowSkeletons() {
  return (
    <ul className='divide-y'>
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className='flex items-center justify-between gap-3 py-2'>
          <div className='space-y-1.5'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-20' />
          </div>
          <Skeleton className='h-4 w-16' />
        </li>
      ))}
    </ul>
  );
}
