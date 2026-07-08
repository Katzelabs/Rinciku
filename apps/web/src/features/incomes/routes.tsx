import type { LoaderFunctionArgs, RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { getIncome } from './api';
import { IncomeDetailRoute } from './components/income-detail-route';
import { IncomeEditRoute } from './components/income-edit-route';
import { IncomesPage } from './pages/incomes';

async function incomeLoader({ params }: LoaderFunctionArgs) {
  const { data, error } = await getIncome(params.id!);
  if (error) throw new Response(error.message, { status: 500 });
  if (!data) throw new Response('Income not found', { status: 404 });
  return data;
}

export const incomesRoutes: RouteObject[] = [
  {
    path: 'incomes',
    handle: { title: 'incomes:page.title' },
    element: protectedRoute(<IncomesPage />),
    children: [
      { path: ':id', loader: incomeLoader, element: <IncomeDetailRoute /> },
      { path: ':id/edit', loader: incomeLoader, element: <IncomeEditRoute /> },
    ],
  },
];
