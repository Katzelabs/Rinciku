import type { LoaderFunctionArgs, RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { getEssential } from './api';
import { EssentialDetailRoute } from './components/essential-detail-route';
import { EssentialEditRoute } from './components/essential-edit-route';
import { EssentialsPage } from './pages/essentials';

async function essentialLoader({ params }: LoaderFunctionArgs) {
  const { data, error } = await getEssential(params.id!);
  if (error) throw new Response(error.message, { status: 500 });
  if (!data) throw new Response('Essential not found', { status: 404 });
  return data;
}

export const essentialsRoutes: RouteObject[] = [
  {
    path: 'essentials',
    element: protectedRoute(<EssentialsPage />),
    children: [
      {
        path: ':id',
        loader: essentialLoader,
        element: <EssentialDetailRoute />,
      },
      {
        path: ':id/edit',
        loader: essentialLoader,
        element: <EssentialEditRoute />,
      },
    ],
  },
];
