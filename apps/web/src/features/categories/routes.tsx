import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { CategoriesPage } from './pages/categories';

export const categoriesRoutes: RouteObject[] = [
  {
    path: 'categories',
    handle: { title: 'categories:page.title' },
    element: protectedRoute(<CategoriesPage />),
  },
];
