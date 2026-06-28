import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@rinciku/core';
import type { CurrencyCode } from '@rinciku/core';
import type { BreakdownItem, CategoryBreakdown } from '../types';
import { currencyTooltipRow } from './chart-utils';

export function CategoryBreakdownChart({
  data,
  base,
}: {
  data: CategoryBreakdown;
  base: CurrencyCode;
}) {
  const { t } = useTranslation('dashboard');
  const config = {
    amount: { label: t('charts.series.spent') },
  } satisfies ChartConfig;

  const [mode, setMode] = useState<'category' | 'tier'>('category');
  const items = mode === 'category' ? data.byCategory : data.byTier;
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className='space-y-4'>
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList>
          <TabsTrigger value='category'>
            {t('charts.breakdownTabs.byCategory')}
          </TabsTrigger>
          <TabsTrigger value='tier'>
            {t('charts.breakdownTabs.byTier')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <EmptyBreakdown />
      ) : (
        <div className='flex flex-col items-center gap-4 sm:flex-row'>
          <ChartContainer
            config={config}
            className='aspect-square h-[200px] shrink-0'
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) =>
                      currencyTooltipRow(
                        value,
                        item.payload?.color,
                        item.payload?.name,
                        base
                      )
                    }
                  />
                }
              />
              <Pie
                data={items}
                dataKey='amount'
                nameKey='name'
                innerRadius={55}
                outerRadius={90}
                paddingAngle={1}
              >
                {items.map((item) => (
                  <Cell key={item.id} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <ul className='w-full flex-1 space-y-2 text-sm'>
            {items.map((item) => (
              <BreakdownRow
                key={item.id}
                item={item}
                total={total}
                base={base}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  item,
  total,
  base,
}: {
  item: BreakdownItem;
  total: number;
  base: CurrencyCode;
}) {
  const percent = total > 0 ? (item.amount / total) * 100 : 0;
  return (
    <li className='flex items-center justify-between gap-3'>
      <span className='flex items-center gap-2 overflow-hidden'>
        <span
          className='size-2.5 shrink-0 rounded-full'
          style={{ backgroundColor: item.color }}
        />
        <span className='truncate font-medium'>{item.name}</span>
        <span className='shrink-0 text-muted-foreground'>
          · {percent.toFixed(0)}%
        </span>
      </span>
      <span className='shrink-0 font-medium tabular-nums'>
        {formatCurrency(item.amount, base)}
      </span>
    </li>
  );
}

function EmptyBreakdown() {
  const { t } = useTranslation('dashboard');
  return (
    <div className='rounded-md border border-dashed bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground'>
      {t('charts.emptyDefault')}
    </div>
  );
}
