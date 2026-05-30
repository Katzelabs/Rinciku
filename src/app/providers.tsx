import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/features/auth';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </AuthProvider>
  );
}
