import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { FxRatesPage } from './pages/fx-rates';

export const fxRatesRoutes: RouteObject[] = [
  {
    path: 'rates',
    handle: { title: 'fxRates:page.title' },
    element: protectedRoute(<FxRatesPage />),
  },
];
