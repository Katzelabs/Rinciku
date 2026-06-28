import {
  useLoaderData,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type CurrencyCode } from '@rinciku/core';

import { type ExpenseWithRelations } from '../api';
import { ExpenseForm } from './expense-form';

type OutletContext = { refetch: () => void };

export function ExpenseEditRoute() {
  const { t } = useTranslation('expenses');
  const navigate = useNavigate();
  const location = useLocation();
  const loaderRow = useLoaderData() as ExpenseWithRelations;
  const { refetch } = useOutletContext<OutletContext>();

  const stateRow = (location.state as { row?: ExpenseWithRelations } | null)
    ?.row;
  const row = stateRow ?? loaderRow;

  return (
    <Dialog
      open
      // Closing edit returns to the detail modal (natural back step).
      onOpenChange={(open) =>
        !open && navigate(`/expenses/${row.id}`, { state: { row } })
      }
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('edit.title')}</DialogTitle>
          <DialogDescription>{t('edit.description')}</DialogDescription>
        </DialogHeader>
        <ExpenseForm
          mode='edit'
          defaultValues={{
            id: row.id,
            amount: Number(row.amount),
            currency: row.currency as CurrencyCode,
            category_id: row.category_id ?? '',
            occurred_at: new Date(row.occurred_at),
            note: row.note ?? '',
          }}
          existingAttachment={
            row.attachment
              ? {
                  id: row.attachment.id,
                  storage_path: row.attachment.storage_path,
                  mime_type: row.attachment.mime_type,
                }
              : null
          }
          onSuccess={() => {
            refetch();
            navigate('/expenses');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
