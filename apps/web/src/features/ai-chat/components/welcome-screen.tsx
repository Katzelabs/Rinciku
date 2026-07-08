import { useTranslation } from 'react-i18next';
import { ChartPie, ReceiptText, Sparkles, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Group = {
  labelKey: string;
  icon: LucideIcon;
  itemKeys: string[];
};

const GROUPS: Group[] = [
  {
    labelKey: 'welcome.groups.affordability',
    icon: Wallet,
    itemKeys: ['welcome.examples.afford1', 'welcome.examples.afford2'],
  },
  {
    labelKey: 'welcome.groups.logTransaction',
    icon: ReceiptText,
    itemKeys: ['welcome.examples.log1', 'welcome.examples.log2'],
  },
  {
    labelKey: 'welcome.groups.monthlySummary',
    icon: ChartPie,
    itemKeys: ['welcome.examples.summary1', 'welcome.examples.summary2'],
  },
];

export function WelcomeScreen({ onSend }: { onSend: (text: string) => void }) {
  const { t } = useTranslation('aiChat');

  return (
    <div className='flex flex-1 flex-col items-center justify-start gap-8 px-6 pt-[clamp(2rem,12vh,7rem)] pb-10'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <div className='flex size-14 items-center justify-center rounded-2xl bg-muted'>
          <Sparkles className='size-7 text-primary' />
        </div>
        <div className='space-y-1'>
          <p className='text-xl font-semibold'>{t('welcome.heading')}</p>
          <p className='max-w-md text-sm text-muted-foreground'>
            {t('welcome.description')}
          </p>
        </div>
      </div>

      <div className='grid w-full max-w-2xl items-stretch gap-4 sm:grid-cols-3'>
        {GROUPS.map((group) => (
          <div
            key={group.labelKey}
            className='flex h-full flex-col gap-2 rounded-2xl border bg-card p-4'
          >
            <div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
              <group.icon className='size-3.5' />
              {t(group.labelKey)}
            </div>
            <div className='flex flex-col gap-1.5'>
              {group.itemKeys.map((itemKey) => {
                const item = t(itemKey);
                return (
                  <button
                    key={itemKey}
                    type='button'
                    className='rounded-xl bg-muted/50 px-3 py-2 text-left text-sm text-foreground transition hover:-translate-y-px hover:bg-muted'
                    onClick={() => onSend(item)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
