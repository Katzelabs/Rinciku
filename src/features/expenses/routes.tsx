import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { ExpensesPage } from './pages/expenses';

export const expensesRoutes: RouteObject[] = [
  { path: 'expenses', element: protectedRoute(<ExpensesPage />) },
];
