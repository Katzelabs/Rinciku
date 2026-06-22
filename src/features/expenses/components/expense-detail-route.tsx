import {
  useLoaderData,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router';

import { type ExpenseWithRelations } from '../api';
import { ExpenseDetailDialog } from './expense-detail-dialog';

type OutletContext = {
  refetch: () => void;
  requestDelete: (row: ExpenseWithRelations) => void;
};

export function ExpenseDetailRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const loaderRow = useLoaderData() as ExpenseWithRelations;
  const { requestDelete } = useOutletContext<OutletContext>();

  // Prefer the row handed over on click (instant open); fall back to the
  // loader data on a fresh load / shared link.
  const stateRow = (location.state as { row?: ExpenseWithRelations } | null)
    ?.row;
  const row = stateRow ?? loaderRow;

  return (
    <ExpenseDetailDialog
      row={row}
      open
      onOpenChange={(open) => !open && navigate('/expenses')}
      onEdit={() => navigate(`/expenses/${row.id}/edit`, { state: { row } })}
      onDelete={() => {
        // Close the detail modal, then hand off to the page's delete
        // confirmation (single source of truth for delete).
        navigate('/expenses');
        requestDelete(row);
      }}
    />
  );
}
