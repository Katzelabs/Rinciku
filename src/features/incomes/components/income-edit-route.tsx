import {
  useLoaderData,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { type IncomeWithRelations } from '../api';
import { IncomeForm } from './income-form';

type OutletContext = { refetch: () => void };

export function IncomeEditRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const loaderRow = useLoaderData() as IncomeWithRelations;
  const { refetch } = useOutletContext<OutletContext>();

  const stateRow = (location.state as { row?: IncomeWithRelations } | null)
    ?.row;
  const row = stateRow ?? loaderRow;

  return (
    <Dialog
      open
      // Closing edit returns to the detail modal (natural back step).
      onOpenChange={(open) =>
        !open && navigate(`/incomes/${row.id}`, { state: { row } })
      }
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Edit income</DialogTitle>
          <DialogDescription>Update the details below.</DialogDescription>
        </DialogHeader>
        <IncomeForm
          mode='edit'
          defaultValues={{
            id: row.id,
            amount: Number(row.amount),
            source_id: row.source_id ?? '',
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
            navigate('/incomes');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
