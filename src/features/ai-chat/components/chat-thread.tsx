import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { ActiveProposal } from '../hooks/use-chat';
import type { ChatItem } from '../types';
import { ExpenseProposalCard } from './expense-proposal-card';
import { IncomeProposalCard } from './income-proposal-card';
import { MessageBubble } from './message-bubble';

const EXAMPLES = [
  'Can I afford a Rp 800.000 keyboard right now?',
  'Spent 45k on lunch',
  'How much do I have left this month?',
];

type Props = {
  messages: ChatItem[];
  isLoading: boolean;
  sending: boolean;
  proposal: ActiveProposal | null;
  onProposalConfirmed: (note: string) => void;
  onProposalCancel: () => void;
};

export function ChatThread({
  messages,
  isLoading,
  sending,
  proposal,
  onProposalConfirmed,
  onProposalCancel,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, proposal]);

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center text-muted-foreground'>
        <Spinner />
      </div>
    );
  }

  if (messages.length === 0 && !proposal) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center'>
        <div className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <Sparkles className='size-6' />
        </div>
        <div className='space-y-1'>
          <p className='font-medium'>Ask Rinciku anything about your money</p>
          <p className='text-sm text-muted-foreground'>
            Get a grounded answer before you spend, or log expenses and income by
            chatting or sending a receipt.
          </p>
        </div>
        <ul className='space-y-1 text-sm text-muted-foreground'>
          {EXAMPLES.map((ex) => (
            <li key={ex} className='italic'>
              “{ex}”
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className='flex-1 overflow-y-auto'>
      <div className='mx-auto flex max-w-3xl flex-col gap-4 p-4'>
        {messages.map((item) => (
          <MessageBubble key={item.id} item={item} />
        ))}

        {proposal ? (
          proposal.proposal.kind === 'income' ? (
            <IncomeProposalCard
              proposal={proposal.proposal}
              attachment={proposal.attachment}
              onConfirmed={onProposalConfirmed}
              onCancel={onProposalCancel}
            />
          ) : (
            <ExpenseProposalCard
              proposal={proposal.proposal}
              attachment={proposal.attachment}
              onConfirmed={onProposalConfirmed}
              onCancel={onProposalCancel}
            />
          )
        ) : null}

        {sending ? (
          <div className='flex items-center gap-2 px-1 text-sm text-muted-foreground'>
            <Spinner className='size-3.5' />
            Rinciku is thinking…
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
