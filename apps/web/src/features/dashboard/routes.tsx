import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { DashboardPage } from './pages/dashboard';

export const dashboardRoutes: RouteObject[] = [
  { index: true, element: protectedRoute(<DashboardPage />) },
];
