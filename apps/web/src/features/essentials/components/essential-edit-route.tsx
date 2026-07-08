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

import { type EssentialWithCategory } from '../api';
import { EssentialForm } from './essential-form';

type OutletContext = { refetch: () => void };

export function EssentialEditRoute() {
  const { t } = useTranslation('essentials');
  const navigate = useNavigate();
  const location = useLocation();
  const loaderRow = useLoaderData() as EssentialWithCategory;
  const { refetch } = useOutletContext<OutletContext>();

  const stateRow = (location.state as { row?: EssentialWithCategory } | null)
    ?.row;
  const row = stateRow ?? loaderRow;

  return (
    <Dialog
      open
      // Closing edit returns to the detail modal (natural back step).
      onOpenChange={(open) =>
        !open && navigate(`/essentials/${row.id}`, { state: { row } })
      }
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('dialog.edit.title')}</DialogTitle>
          <DialogDescription>{t('dialog.edit.description')}</DialogDescription>
        </DialogHeader>
        <EssentialForm
          mode='edit'
          defaultValues={{
            id: row.id,
            name: row.name,
            estimated_amount: Number(row.estimated_amount),
            currency: row.currency as CurrencyCode,
            category_id: row.category_id ?? '',
            notes: row.notes ?? '',
          }}
          onSuccess={() => {
            refetch();
            navigate('/essentials');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
