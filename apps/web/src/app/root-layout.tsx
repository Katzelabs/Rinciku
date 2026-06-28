import { Outlet } from 'react-router';
import { Providers } from './providers';

export function RootLayout() {
  return (
    <Providers>
      <Outlet />
    </Providers>
  );
}
