import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatCurrencyCompact } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';
import type { BudgetComparisonItem } from '../types';
import { currencyTooltipRow } from './chart-utils';

export function BudgetVsActualChart({
  data,
  base,
}: {
  data: BudgetComparisonItem[];
  base: CurrencyCode;
}) {
  const { t } = useTranslation('dashboard');
  const config = {
    target: { label: t('charts.series.budget'), color: 'var(--chart-4)' },
    actual: { label: t('charts.series.actual'), color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  // Horizontal bars: category names on the Y axis read better than rotated X
  // labels when there are many categories. Grow height with the row count.
  const height = Math.max(200, data.length * 48);

  return (
    <ChartContainer config={config} style={{ height }} className='w-full'>
      <BarChart
        data={data}
        layout='vertical'
        margin={{ left: 8, right: 8, top: 8 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis
          type='number'
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrencyCompact(Number(value), base)}
        />
        <YAxis
          type='category'
          dataKey='name'
          tickLine={false}
          axisLine={false}
          width={110}
          tickMargin={4}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, item) =>
                currencyTooltipRow(
                  value,
                  item.color,
                  config[name as keyof typeof config]?.label ?? name,
                  base
                )
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey='target' fill='var(--color-target)' radius={4} />
        <Bar dataKey='actual' fill='var(--color-actual)' radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
