import type { RouteObject } from 'react-router';
import { DashboardPage } from './pages/dashboard';

export const dashboardRoutes: RouteObject[] = [
  { index: true, element: <DashboardPage /> },
];
