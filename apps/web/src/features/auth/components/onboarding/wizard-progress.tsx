import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  step: number;
  total: number;
}

// Slim segment bar (one filled segment per completed/current step). Scales to
// any number of steps without crowding — the numbered-pill layout broke down
// once onboarding grew past a handful of steps.
export function WizardProgress({ step, total }: WizardProgressProps) {
  const { t } = useTranslation('auth');

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-1.5'>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-primary' : 'bg-muted'
            )}
            aria-hidden
          />
        ))}
      </div>
      <span className='block text-sm text-muted-foreground'>
        {t('onboarding.progress', { current: step + 1, total })}
      </span>
    </div>
  );
}
