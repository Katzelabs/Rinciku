import { useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CURRENCY_NAMES, currencyFlag } from '@/lib/currency-meta';
import { formatCurrency } from '@/lib/format';
import { convertToBase, CURRENCY_CODES, type CurrencyCode } from '@/lib/fx';

type Props = {
  /** Currency to express every rate against. */
  base: CurrencyCode;
};

export function RateTable({ base }: Props) {
  const { t } = useTranslation('fxRates');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  // All supported currencies except the base itself — a base-vs-base row is noise.
  const codes = CURRENCY_CODES.filter(
    (code) =>
      code !== base &&
      (q === '' ||
        code.toLowerCase().includes(q) ||
        CURRENCY_NAMES[code].toLowerCase().includes(q))
  );

  return (
    <div className='flex flex-col gap-3'>
      <div className='relative max-w-xs'>
        <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('table.searchPlaceholder')}
          className='pl-9'
          aria-label={t('table.searchLabel')}
        />
      </div>

      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead>{t('table.currency')}</TableHead>
              <TableHead className='text-right'>
                {t('table.perUnit', { base })}
              </TableHead>
              <TableHead className='hidden text-right sm:table-cell'>
                {t('table.inverse', { base })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.length === 0 ? (
              <TableRow className='hover:bg-transparent'>
                <TableCell
                  colSpan={3}
                  className='py-8 text-center text-sm text-muted-foreground'
                >
                  {t('table.noMatch', { query })}
                </TableCell>
              </TableRow>
            ) : (
              codes.map((code) => {
                const perUnit = convertToBase(1, code, base).amount_base;
                const inverse = convertToBase(1, base, code).amount_base;
                return (
                  <TableRow key={code}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <span aria-hidden className='text-xl leading-none'>
                          {currencyFlag(code)}
                        </span>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{code}</span>
                          <span className='text-xs text-muted-foreground'>
                            {CURRENCY_NAMES[code]}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>
                      {formatCurrency(perUnit, base)}
                    </TableCell>
                    <TableCell className='hidden text-right tabular-nums text-muted-foreground sm:table-cell'>
                      {formatCurrency(inverse, code)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
