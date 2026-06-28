import { format } from 'date-fns';

import type { CsvCell } from '@rinciku/core';
import type { IncomeWithRelations } from '../api';

// Column order is the CSV contract shared with the import side. `source` is
// exported for the user's reference but ignored on re-import. The `category`
// column carries the income source name (joined via source_id).
export const INCOME_CSV_COLUMNS = [
  'date',
  'amount',
  'currency',
  'category',
  'note',
  'source',
] as const;

// Amounts stay in their ORIGINAL currency (no base conversion) so the export
// round-trips losslessly back through import.
export function toIncomeCsvRows(
  rows: IncomeWithRelations[]
): Record<string, CsvCell>[] {
  return rows.map((row) => ({
    date: format(new Date(row.occurred_at), 'yyyy-MM-dd'),
    amount: Number(row.amount),
    currency: row.currency,
    category: row.category?.name ?? '',
    note: row.note ?? '',
    source: row.source,
  }));
}
