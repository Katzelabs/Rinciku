import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { IncomesPage } from './pages/incomes';

export const incomesRoutes: RouteObject[] = [
  { path: 'incomes', element: protectedRoute(<IncomesPage />) },
];
