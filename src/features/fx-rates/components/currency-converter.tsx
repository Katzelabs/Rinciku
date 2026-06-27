import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { CurrencyAmountInput } from '@/components/shared/currency-amount-input';
import { CurrencySelect } from '@/components/shared/currency-select';
import { currencyFlag } from '@/lib/currency-meta';
import { formatCurrency } from '@/lib/format';
import { convertToBase, type CurrencyCode } from '@/lib/fx';

type Props = {
  /** User's base currency, used as the initial "to" currency. */
  base: CurrencyCode;
};

export function CurrencyConverter({ base }: Props) {
  const { t } = useTranslation('fxRates');
  const [amount, setAmount] = useState<number | undefined>(100);
  const [from, setFrom] = useState<CurrencyCode>(
    base === 'USD' ? 'IDR' : 'USD'
  );
  const [to, setTo] = useState<CurrencyCode>(base);

  const parsed = amount ?? 0;
  const { amount_base: converted } = convertToBase(parsed, from, to);
  const unitRate = convertToBase(1, from, to).amount_base;

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('converter.title')}</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]'>
          <Field>
            <FieldLabel htmlFor='converter-amount'>
              {t('converter.from')}
            </FieldLabel>
            <CurrencySelect value={from} onChange={setFrom} />
            <CurrencyAmountInput
              id='converter-amount'
              currency={from}
              value={amount}
              onChange={setAmount}
            />
          </Field>

          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={handleSwap}
            aria-label={t('converter.swap')}
            className='mx-auto my-1 rotate-90 sm:mb-1 sm:rotate-0'
          >
            <ArrowRightLeft />
          </Button>

          <Field>
            <FieldLabel>{t('converter.to')}</FieldLabel>
            <CurrencySelect value={to} onChange={setTo} />
            <div className='flex h-9 items-center gap-2 rounded-md border bg-muted/40 px-3'>
              <span aria-hidden className='text-base leading-none'>
                {currencyFlag(to)}
              </span>
              <span className='truncate text-lg font-semibold tabular-nums'>
                {formatCurrency(converted, to)}
              </span>
            </div>
          </Field>
        </div>

        <p className='text-xs text-muted-foreground'>
          {t('converter.rateLine', {
            from,
            fromRate: formatCurrency(unitRate, to),
            to,
            toRate: formatCurrency(convertToBase(1, to, from).amount_base, from),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
