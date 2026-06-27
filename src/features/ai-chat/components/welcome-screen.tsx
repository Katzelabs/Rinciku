import { useTranslation } from 'react-i18next';
import { ChartPie, ReceiptText, Sparkles, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className='flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <div className='flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-primary/20'>
          <Sparkles className='size-7' />
        </div>
        <div className='space-y-1'>
          <p className='text-xl font-semibold'>{t('welcome.heading')}</p>
          <p className='max-w-md text-sm text-muted-foreground'>
            {t('welcome.description')}
          </p>
        </div>
      </div>

      <div className='grid w-full max-w-2xl gap-5 sm:grid-cols-3'>
        {GROUPS.map((group) => (
          <div key={group.labelKey} className='space-y-2'>
            <div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
              <group.icon className='size-3.5' />
              {t(group.labelKey)}
            </div>
            <div className='flex flex-col gap-1.5'>
              {group.itemKeys.map((itemKey) => {
                const item = t(itemKey);
                return (
                  <Button
                    key={itemKey}
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-auto justify-start whitespace-normal rounded-xl py-2 text-left text-sm font-normal text-muted-foreground hover:text-foreground'
                    onClick={() => onSend(item)}
                  >
                    {item}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
