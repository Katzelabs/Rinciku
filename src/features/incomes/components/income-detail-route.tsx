import {
  useLoaderData,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router';

import { type IncomeWithRelations } from '../api';
import { IncomeDetailDialog } from './income-detail-dialog';

type OutletContext = {
  refetch: () => void;
  requestDelete: (row: IncomeWithRelations) => void;
};

export function IncomeDetailRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const loaderRow = useLoaderData() as IncomeWithRelations;
  const { requestDelete } = useOutletContext<OutletContext>();

  // Prefer the row handed over on click (instant open); fall back to the
  // loader data on a fresh load / shared link.
  const stateRow = (location.state as { row?: IncomeWithRelations } | null)
    ?.row;
  const row = stateRow ?? loaderRow;

  return (
    <IncomeDetailDialog
      row={row}
      open
      onOpenChange={(open) => !open && navigate('/incomes')}
      onEdit={() => navigate(`/incomes/${row.id}/edit`, { state: { row } })}
      onDelete={() => {
        // Close the detail modal, then hand off to the page's delete
        // confirmation (single source of truth for delete).
        navigate('/incomes');
        requestDelete(row);
      }}
    />
  );
}
