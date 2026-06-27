import { useEffect, useRef, type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ensureRates } from '@/lib/fx';
import { useFxStatus } from '@/lib/use-fx-status';
import i18n, { isLanguage } from '@/i18n';
import { AuthProvider, useAuth } from '@/features/auth';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <LanguageSync />
        <TooltipProvider>
          <FxBootstrapper />
          {children}
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Renders nothing; applies the logged-in user's stored language preference.
// localStorage (via the language detector) covers the pre-auth gap; once the
// profile loads, its `language` column becomes authoritative across devices.
function LanguageSync() {
  const { profile } = useAuth();

  useEffect(() => {
    const lang = profile?.language;
    if (isLanguage(lang) && lang !== i18n.resolvedLanguage) {
      void i18n.changeLanguage(lang);
    }
  }, [profile?.language]);

  return null;
}

// Renders nothing; owns the one-shot FX refresh at app boot and the
// once-per-session warning toast when the live source is unreachable.
function FxBootstrapper() {
  const status = useFxStatus();
  const warnedRef = useRef(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    void ensureRates();
  }, []);

  useEffect(() => {
    if (status.source === 'stub' && !warnedRef.current) {
      warnedRef.current = true;
      toast.warning(t('fx.refreshFailed'), {
        description: t('fx.fallbackSnapshot', { date: status.stubDate }),
      });
    }
  }, [status.source, status.stubDate, t]);

  return null;
}
