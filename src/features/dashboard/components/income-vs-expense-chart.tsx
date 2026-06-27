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
import type { TrendPoint } from '../types';
import { currencyTooltipRow } from './chart-utils';

export function IncomeVsExpenseChart({
  data,
  base,
}: {
  data: TrendPoint[];
  base: CurrencyCode;
}) {
  const { t } = useTranslation('dashboard');
  const config = {
    income: { label: t('charts.series.income'), color: 'var(--chart-2)' },
    spent: { label: t('charts.series.spent'), color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className='h-[240px] w-full'>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
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
        <Bar
          dataKey='income'
          fill='var(--color-income)'
          radius={[4, 4, 0, 0]}
        />
        <Bar dataKey='spent' fill='var(--color-spent)' radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
