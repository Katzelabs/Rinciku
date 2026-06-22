import type { LoaderFunctionArgs, RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { getExpense } from './api';
import { ExpenseDetailRoute } from './components/expense-detail-route';
import { ExpenseEditRoute } from './components/expense-edit-route';
import { ExpensesPage } from './pages/expenses';

async function expenseLoader({ params }: LoaderFunctionArgs) {
  const { data, error } = await getExpense(params.id!);
  if (error) throw new Response(error.message, { status: 500 });
  if (!data) throw new Response('Expense not found', { status: 404 });
  return data;
}

export const expensesRoutes: RouteObject[] = [
  {
    path: 'expenses',
    element: protectedRoute(<ExpensesPage />),
    children: [
      { path: ':id', loader: expenseLoader, element: <ExpenseDetailRoute /> },
      {
        path: ':id/edit',
        loader: expenseLoader,
        element: <ExpenseEditRoute />,
      },
    ],
  },
];
