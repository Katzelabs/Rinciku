import { useState } from 'react';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DateRangePicker,
  type DateRangeValue,
} from '@/components/shared/date-range-picker';
import { downloadCsv, toCsv } from '@/lib/csv';
import { listIncomes } from '../api';
import { INCOME_CSV_COLUMNS, toIncomeCsvRows } from '../lib/csv-export';

const EXPORT_ROW_CAP = 10000;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Scope = 'all' | 'range';

function defaultRange(): DateRangeValue {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export function IncomeExportDialog({ open, onOpenChange }: Props) {
  const [scope, setScope] = useState<Scope>('all');
  const [range, setRange] = useState<DateRangeValue>(defaultRange);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    // For "all", use wide but valid bounds. The JS max Date serializes to an
    // expanded-year ISO string (`+275760-…`) that Postgres can't parse.
    const fromIso =
      scope === 'range' ? range.from.toISOString() : '1970-01-01T00:00:00.000Z';
    const toIso =
      scope === 'range' ? range.to.toISOString() : '9999-12-31T23:59:59.999Z';

    const { data, error } = await listIncomes({
      from: fromIso,
      to: toIso,
      limit: EXPORT_ROW_CAP,
      offset: 0,
    });
    setExporting(false);

    if (error) {
      toast.error('Could not export incomes.');
      return;
    }
    const rows = data ?? [];
    if (rows.length === 0) {
      toast.info('Nothing to export for the selected range.');
      return;
    }

    const suffix =
      scope === 'range'
        ? `${format(range.from, 'yyyy-MM-dd')}_${format(range.to, 'yyyy-MM-dd')}`
        : 'all';
    downloadCsv(
      `incomes-${suffix}.csv`,
      toCsv(toIncomeCsvRows(rows), INCOME_CSV_COLUMNS)
    );
    if (rows.length === EXPORT_ROW_CAP) {
      toast.warning(
        `Exported the first ${EXPORT_ROW_CAP} rows — narrow the date range to export the rest.`
      );
    } else {
      toast.success(`Exported ${rows.length} incomes`);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !exporting && onOpenChange(o)}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Export incomes</DialogTitle>
          <DialogDescription>
            Download your incomes as a CSV file. Amounts are exported in their
            original currency.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <TabsList className='w-full'>
              <TabsTrigger value='all' className='flex-1'>
                All data
              </TabsTrigger>
              <TabsTrigger value='range' className='flex-1'>
                Date range
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {scope === 'range' && (
            <div className='space-y-1.5'>
              <p className='text-sm text-muted-foreground'>
                Export incomes dated within:
              </p>
              <DateRangePicker value={range} onChange={setRange} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <Download className='size-4' />
            )}
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
