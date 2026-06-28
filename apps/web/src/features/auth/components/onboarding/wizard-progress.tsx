import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  step: number;
  total: number;
}

export function WizardProgress({ step, total }: WizardProgressProps) {
  const { t } = useTranslation('auth');
  const value = ((step + 1) / total) * 100;

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
                i < step && 'bg-primary text-primary-foreground',
                i === step && 'bg-primary text-primary-foreground',
                i > step && 'bg-muted text-muted-foreground'
              )}
              aria-hidden
            >
              {i + 1}
            </span>
          ))}
        </div>
        <span className='text-sm text-muted-foreground'>
          {t('onboarding.progress', { current: step + 1, total })}
        </span>
      </div>
      <Progress value={value} />
    </div>
  );
}
