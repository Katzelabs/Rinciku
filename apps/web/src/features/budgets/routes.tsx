import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { BudgetsPage } from './pages/budgets';

export const budgetsRoutes: RouteObject[] = [
  {
    path: 'budgets',
    handle: { title: 'budgets:page.title' },
    element: protectedRoute(<BudgetsPage />),
  },
];
