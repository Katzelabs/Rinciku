import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/shared/app-shell';
import { aiChatRoutes } from '@/features/ai-chat';
import {
  authPublicRoutes,
  authRoutes,
  guestRoutes,
  onboardingRoutes,
  requireAuthLoader,
  requireGuestLoader,
  requireOnboardedLoader,
} from '@/features/auth';
import { budgetsRoutes } from '@/features/budgets';
import { categoriesRoutes } from '@/features/categories';
import { dashboardRoutes } from '@/features/dashboard';
import { essentialsRoutes } from '@/features/essentials';
import { expensesRoutes } from '@/features/expenses';
import { fxRatesRoutes } from '@/features/fx-rates';
import { incomesRoutes } from '@/features/incomes';
import { legalRoutes } from '@/features/legal';
import { ErrorBoundary } from './error-boundary';
import { NotFound } from './not-found';
import { RootLayout } from './root-layout';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { loader: requireGuestLoader, children: guestRoutes },
      ...authPublicRoutes,
      ...legalRoutes,
      { loader: requireAuthLoader, children: onboardingRoutes },
      {
        element: <AppShell />,
        loader: requireOnboardedLoader,
        children: [
          ...dashboardRoutes,
          ...expensesRoutes,
          ...incomesRoutes,
          ...essentialsRoutes,
          ...categoriesRoutes,
          ...budgetsRoutes,
          ...fxRatesRoutes,
          ...aiChatRoutes,
          ...authRoutes,
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
