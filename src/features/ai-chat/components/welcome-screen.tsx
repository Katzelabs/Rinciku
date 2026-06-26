import { ChartPie, ReceiptText, Sparkles, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Group = {
  label: string;
  icon: LucideIcon;
  items: string[];
};

const GROUPS: Group[] = [
  {
    label: 'Check affordability',
    icon: Wallet,
    items: [
      'Can I afford a Rp 800.000 keyboard right now?',
      'Is it okay to spend 250k on dinner tonight?',
    ],
  },
  {
    label: 'Log a transaction',
    icon: ReceiptText,
    items: ['Spent 45k on lunch', 'Got my 5jt salary today'],
  },
  {
    label: 'Monthly summary',
    icon: ChartPie,
    items: [
      'How much do I have left this month?',
      'Where did most of my money go?',
    ],
  },
];

export function WelcomeScreen({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <div className='flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-primary/20'>
          <Sparkles className='size-7' />
        </div>
        <div className='space-y-1'>
          <p className='text-xl font-semibold'>
            Ask Rinciku anything about your money
          </p>
          <p className='max-w-md text-sm text-muted-foreground'>
            Get a grounded answer before you spend, or log expenses and income
            by chatting or sending a receipt.
          </p>
        </div>
      </div>

      <div className='grid w-full max-w-2xl gap-5 sm:grid-cols-3'>
        {GROUPS.map((group) => (
          <div key={group.label} className='space-y-2'>
            <div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
              <group.icon className='size-3.5' />
              {group.label}
            </div>
            <div className='flex flex-col gap-1.5'>
              {group.items.map((item) => (
                <Button
                  key={item}
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-auto justify-start whitespace-normal rounded-xl py-2 text-left text-sm font-normal text-muted-foreground hover:text-foreground'
                  onClick={() => onSend(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
