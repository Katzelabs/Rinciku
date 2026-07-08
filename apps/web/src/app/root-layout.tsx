import { Outlet } from 'react-router';
import { TitleManager } from '@/components/shared/title-manager';
import { Providers } from './providers';

export function RootLayout() {
  return (
    <Providers>
      <TitleManager />
      <Outlet />
    </Providers>
  );
}
