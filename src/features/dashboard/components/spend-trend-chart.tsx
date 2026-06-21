import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatCurrencyCompact } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';
import type { TrendPoint } from '../types';
import { currencyTooltipRow } from './chart-utils';

const config = {
  spent: { label: 'Spent', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function SpendTrendChart({
  data,
  base,
}: {
  data: TrendPoint[];
  base: CurrencyCode;
}) {
  return (
    <ChartContainer config={config} className='h-[240px] w-full'>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='label'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(value) => formatCurrencyCompact(Number(value), base)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator='line'
              formatter={(value, _name, item) =>
                currencyTooltipRow(value, item.color, config.spent.label, base)
              }
            />
          }
        />
        <Area
          dataKey='spent'
          type='monotone'
          stroke='var(--color-spent)'
          fill='var(--color-spent)'
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
