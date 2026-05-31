import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/shared/app-shell';
import { aiChatRoutes } from '@/features/ai-chat';
import {
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
import { ErrorBoundary } from './error-boundary';
import { NotFound } from './not-found';
import { RootLayout } from './root-layout';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { loader: requireGuestLoader, children: guestRoutes },
      { loader: requireAuthLoader, children: onboardingRoutes },
      {
        element: <AppShell />,
        loader: requireOnboardedLoader,
        children: [
          ...dashboardRoutes,
          ...expensesRoutes,
          ...essentialsRoutes,
          ...categoriesRoutes,
          ...budgetsRoutes,
          ...aiChatRoutes,
          ...authRoutes,
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
