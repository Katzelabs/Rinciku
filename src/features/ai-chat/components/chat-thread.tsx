import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActiveProposal } from '../hooks/use-chat';
import type { ChatItem } from '../types';
import { ChatMessage } from './chat-message';
import { ChatThreadSkeleton } from './chat-thread-skeleton';
import { ExpenseProposalCard } from './expense-proposal-card';
import { IncomeProposalCard } from './income-proposal-card';
import { TypingIndicator } from './typing-indicator';
import { WelcomeScreen } from './welcome-screen';

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
    return <ChatThreadSkeleton />;
  }

  if (messages.length === 0 && !proposal) {
    return <WelcomeScreen onSend={onSendExample} />;
  }

  return (
    <div className='relative flex min-h-0 flex-1 flex-col'>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto'
      >
        <div className='mx-auto flex min-w-0 max-w-3xl flex-col gap-6 px-4 py-6'>
          {messages.map((item) => (
            <ChatMessage key={item.id} item={item} />
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
