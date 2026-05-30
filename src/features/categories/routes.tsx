import type { RouteObject } from 'react-router';
import { CategoriesPage } from './pages/categories';

export const categoriesRoutes: RouteObject[] = [
  { path: 'categories', element: <CategoriesPage /> },
];
