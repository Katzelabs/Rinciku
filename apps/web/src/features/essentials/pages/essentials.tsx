import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
import type { CurrencyCode } from '@rinciku/core';
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
  const { t } = useTranslation('essentials');
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
      toast.error(t('toast.deleteError'));
      return;
    }
    toast.success(t('toast.deleted'));
    setDialog(null);
    refetch();
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>{t('page.title')}</h1>
          <p className='text-sm text-muted-foreground'>{t('page.subtitle')}</p>
        </div>
        <Button onClick={() => setDialog({ kind: 'create' })}>
          <Plus className='size-4' />
          {t('page.addButton')}
        </Button>
      </div>

      <Card className='gap-0 py-0'>
        <div className='p-4 sm:p-5'>
          {error ? (
            <div className='rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive'>
              {t('page.loadError', { error })}
            </div>
          ) : (
            <EssentialTable
              rows={rows}
              baseCurrency={baseCurrency}
              onAdd={() => setDialog({ kind: 'create' })}
              onEdit={(row) => setDialog({ kind: 'edit', row })}
              onDelete={(row) => setDialog({ kind: 'delete', row })}
              bordered={false}
              isLoading={loading}
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
        open={dialog?.kind === 'edit'}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('dialog.edit.title')}</DialogTitle>
            <DialogDescription>
              {t('dialog.edit.description')}
            </DialogDescription>
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
