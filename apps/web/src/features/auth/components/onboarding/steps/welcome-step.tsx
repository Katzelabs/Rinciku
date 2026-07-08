import { useTranslation } from 'react-i18next';
import { CalendarClock, Receipt, ShieldCheck, Wallet } from 'lucide-react';

// The four grounding signals the AI consultation reasons over. Ordered to mirror
// the rest of the wizard: income → essentials → spending → time left.
const POINTS = [
  { key: 'income', Icon: Wallet },
  { key: 'essentials', Icon: ShieldCheck },
  { key: 'spending', Icon: Receipt },
  { key: 'daysLeft', Icon: CalendarClock },
] as const;

export function WelcomeStep() {
  const { t } = useTranslation('auth');
  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        {t('onboarding.steps.welcome.intro')}
      </p>
      <ul className='space-y-3'>
        {POINTS.map(({ key, Icon }) => (
          <li key={key} className='flex items-start gap-3'>
            <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <Icon className='size-5' />
            </span>
            <div className='space-y-0.5'>
              <p className='text-sm font-medium'>
                {t(`onboarding.steps.welcome.points.${key}.title`)}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t(`onboarding.steps.welcome.points.${key}.description`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className='text-sm text-muted-foreground'>
        {t('onboarding.steps.welcome.outro')}
      </p>
    </div>
  );
}
