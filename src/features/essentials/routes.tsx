import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { EssentialsPage } from './pages/essentials';

export const essentialsRoutes: RouteObject[] = [
  { path: 'essentials', element: protectedRoute(<EssentialsPage />) },
];
