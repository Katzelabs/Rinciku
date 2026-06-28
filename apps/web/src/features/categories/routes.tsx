import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { CategoriesPage } from './pages/categories';

export const categoriesRoutes: RouteObject[] = [
  { path: 'categories', element: protectedRoute(<CategoriesPage />) },
];
