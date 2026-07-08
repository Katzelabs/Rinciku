import {
  useLoaderData,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router';

import { type EssentialWithCategory } from '../api';
import { EssentialDetailDialog } from './essential-detail-dialog';

type OutletContext = {
  refetch: () => void;
  requestDelete: (row: EssentialWithCategory) => void;
};

export function EssentialDetailRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const loaderRow = useLoaderData() as EssentialWithCategory;
  const { requestDelete } = useOutletContext<OutletContext>();

  // Prefer the row handed over on click (instant open); fall back to the
  // loader data on a fresh load / shared link.
  const stateRow = (location.state as { row?: EssentialWithCategory } | null)
    ?.row;
  const row = stateRow ?? loaderRow;

  return (
    <EssentialDetailDialog
      row={row}
      open
      onOpenChange={(open) => !open && navigate('/essentials')}
      onEdit={() => navigate(`/essentials/${row.id}/edit`, { state: { row } })}
      onDelete={() => {
        // Close the detail modal, then hand off to the page's delete
        // confirmation (single source of truth for delete).
        navigate('/essentials');
        requestDelete(row);
      }}
    />
  );
}
