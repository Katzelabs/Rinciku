import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { BudgetsPage } from './pages/budgets';

export const budgetsRoutes: RouteObject[] = [
  { path: 'budgets', element: protectedRoute(<BudgetsPage />) },
];
