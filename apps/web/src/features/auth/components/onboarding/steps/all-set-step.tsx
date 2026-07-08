import { useTranslation } from 'react-i18next';
import { LineChart, MessageSquarePlus, Sparkles } from 'lucide-react';

// First-action tips shown on the closing step — what to do the moment onboarding
// finishes and the app shell opens.
const TIPS = [
  { key: 'log', Icon: MessageSquarePlus },
  { key: 'ask', Icon: Sparkles },
  { key: 'track', Icon: LineChart },
] as const;

export function AllSetStep() {
  const { t } = useTranslation('auth');
  return (
    <ul className='space-y-3'>
      {TIPS.map(({ key, Icon }) => (
        <li key={key} className='flex items-start gap-3'>
          <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <Icon className='size-5' />
          </span>
          <div className='space-y-0.5'>
            <p className='text-sm font-medium'>
              {t(`onboarding.steps.allSet.tips.${key}.title`)}
            </p>
            <p className='text-sm text-muted-foreground'>
              {t(`onboarding.steps.allSet.tips.${key}.description`)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
