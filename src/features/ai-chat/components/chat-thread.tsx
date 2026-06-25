import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { ActiveProposal } from '../hooks/use-chat';
import type { ChatItem } from '../types';
import { ExpenseProposalCard } from './expense-proposal-card';
import { IncomeProposalCard } from './income-proposal-card';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';

const EXAMPLES = [
  'Can I afford a Rp 800.000 keyboard right now?',
  'Spent 45k on lunch',
  'How much do I have left this month?',
];

const NEAR_BOTTOM_PX = 120;

type Props = {
  messages: ChatItem[];
  isLoading: boolean;
  sending: boolean;
  proposal: ActiveProposal | null;
  onSendExample: (text: string) => void;
  onProposalConfirmed: (note: string) => void;
  onProposalCancel: () => void;
};

export function ChatThread({
  messages,
  isLoading,
  sending,
  proposal,
  onSendExample,
  onProposalConfirmed,
  onProposalCancel,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [nearBottom, setNearBottom] = useState(true);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setNearBottom(distance < NEAR_BOTTOM_PX);
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    bottomRef.current?.scrollIntoView({ behavior });
  }

  // Auto-follow new content only when the user is already near the bottom, so
  // scrolling up to read history is never interrupted.
  useEffect(() => {
    if (nearBottom) scrollToBottom('smooth');
  }, [messages, sending, proposal, nearBottom]);

  // Jump to the latest message instantly after a conversation loads.
  useEffect(() => {
    if (!isLoading) scrollToBottom('auto');
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center text-muted-foreground'>
        <Spinner />
      </div>
    );
  }

  if (messages.length === 0 && !proposal) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center'>
        <div className='flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-primary/20'>
          <Sparkles className='size-7' />
        </div>
        <div className='space-y-1'>
          <p className='text-lg font-semibold'>
            Ask Rinciku anything about your money
          </p>
          <p className='max-w-md text-sm text-muted-foreground'>
            Get a grounded answer before you spend, or log expenses and income
            by chatting or sending a receipt.
          </p>
        </div>
        <div className='flex flex-wrap justify-center gap-2'>
          {EXAMPLES.map((ex) => (
            <Button
              key={ex}
              type='button'
              variant='outline'
              size='sm'
              className='h-auto rounded-full py-1.5 text-muted-foreground hover:text-foreground'
              onClick={() => onSendExample(ex)}
            >
              {ex}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='relative flex min-h-0 flex-1 flex-col'>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto'
      >
        <div className='mx-auto flex max-w-3xl flex-col gap-4 p-4'>
          {messages.map((item) => (
            <MessageBubble key={item.id} item={item} />
          ))}

          {proposal ? (
            <div className='duration-300 animate-in fade-in slide-in-from-bottom-2'>
              {proposal.proposal.kind === 'income' ? (
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
              )}
            </div>
          ) : null}

          {sending ? <TypingIndicator /> : null}

          <div ref={bottomRef} />
        </div>
      </div>

      {!nearBottom ? (
        <Button
          type='button'
          size='icon'
          variant='outline'
          onClick={() => scrollToBottom('smooth')}
          aria-label='Scroll to latest message'
          className='absolute bottom-4 right-4 rounded-full shadow-md duration-200 animate-in fade-in zoom-in-95'
        >
          <ChevronDown className='size-4' />
        </Button>
      ) : null}
    </div>
  );
}
