import { useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ensureRates } from '@/lib/fx';
import { useFxStatus } from '@/lib/use-fx-status';
import { AuthProvider } from '@/features/auth';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <FxBootstrapper />
        {children}
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  );
}

// Renders nothing; owns the one-shot FX refresh at app boot and the
// once-per-session warning toast when the live source is unreachable.
function FxBootstrapper() {
  const status = useFxStatus();
  const warnedRef = useRef(false);

  useEffect(() => {
    void ensureRates();
  }, []);

  useEffect(() => {
    if (status.source === 'stub' && !warnedRef.current) {
      warnedRef.current = true;
      toast.warning("Couldn't refresh FX rates", {
        description: `Showing fallback snapshot from ${status.stubDate}.`,
      });
    }
  }, [status.source, status.stubDate]);

  return null;
}
