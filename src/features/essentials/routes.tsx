import type { RouteObject } from 'react-router';
import { EssentialsPage } from './pages/essentials';

export const essentialsRoutes: RouteObject[] = [
  { path: 'essentials', element: <EssentialsPage /> },
];
