import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { DashboardPage } from './pages/dashboard';

export const dashboardRoutes: RouteObject[] = [
  {
    index: true,
    handle: { title: 'dashboard:page.title' },
    element: protectedRoute(<DashboardPage />),
  },
];
