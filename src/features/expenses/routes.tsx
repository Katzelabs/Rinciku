import type { RouteObject } from 'react-router';
import { ExpensesPage } from './pages/expenses';

export const expensesRoutes: RouteObject[] = [
  { path: 'expenses', element: <ExpensesPage /> },
];
