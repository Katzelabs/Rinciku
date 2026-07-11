import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CurrencyCode } from '@rinciku/core';
import type { ActiveProposal } from '../hooks/use-chat';
import type {
  ChatItem,
  ExportFormat,
  ProposedChange,
  ProposedExport,
} from '../types';
import { ActionProposalCard } from './action-proposal-card';
import { ChatMessage } from './chat-message';
import { ChatThreadSkeleton } from './chat-thread-skeleton';
import { ExpenseProposalCard } from './expense-proposal-card';
import { ExportCard } from './export-card';
import { IncomeProposalCard } from './income-proposal-card';
import { TypingIndicator } from './typing-indicator';
import { WelcomeScreen } from './welcome-screen';

const NEAR_BOTTOM_PX = 120;
// Nearing the top of the scroll area loads the next OLDER page.
const LOAD_OLDER_PX = 300;

type Props = {
  messages: ChatItem[];
  isLoading: boolean;
  sending: boolean;
  hasOlderMessages: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  proposal: ActiveProposal | null;
  pendingChange: ProposedChange | null;
  confirmingChange: boolean;
  pendingExport: ProposedExport | null;
  preparingExport: boolean;
  baseCurrency: CurrencyCode;
  onSendExample: (text: string) => void;
  onProposalConfirmed: (note: string) => void;
  onProposalCancel: () => void;
  onChangeConfirm: () => void;
  onChangeCancel: () => void;
  onExportConfirm: (format: ExportFormat) => void;
  onExportCancel: () => void;
};

// The message list, virtualized with @tanstack/react-virtual: only the rows in
// (and around) the viewport mount, so long threads don't pay react-markdown +
// syntax-highlight cost for every message. Rows are absolutely positioned and
// dynamically measured (markdown heights vary wildly); the transient live-turn
// extras (proposal cards, typing indicator) render un-virtualized after the
// sized container — they're few and short-lived.
export function ChatThread({
  messages,
  isLoading,
  sending,
  hasOlderMessages,
  isLoadingOlder,
  onLoadOlder,
  proposal,
  pendingChange,
  confirmingChange,
  pendingExport,
  preparingExport,
  baseCurrency,
  onSendExample,
  onProposalConfirmed,
  onProposalCancel,
  onChangeConfirm,
  onChangeCancel,
  onExportConfirm,
  onExportCancel,
}: Props) {
  // React Compiler can't analyze @tanstack/react-virtual's subscription model;
  // opt out explicitly — the virtualizer bounds render cost itself.
  'use no memo';
  const { t } = useTranslation('aiChat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nearBottom, setNearBottom] = useState(true);

  // Scroll anchoring across an older-page prepend: capture the metrics when the
  // fetch is triggered, restore the offset when the new first row lands. While
  // set, auto-follow is suppressed.
  const prependAnchorRef = useRef<{
    prevScrollHeight: number;
    prevScrollTop: number;
  } | null>(null);
  const firstIdRef = useRef<string | null>(null);

  // eslint-disable-next-line react-hooks/incompatible-library -- covered by the 'use no memo' opt-out above
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 100,
    overscan: 8,
    // Keyed by message id so measurements survive index shifts on prepend.
    getItemKey: (index) => messages[index].id,
    // Top padding of the thread (the bottom is on the un-virtualized footer).
    paddingStart: 24,
  });
  const totalSize = virtualizer.getTotalSize();

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setNearBottom(distance < NEAR_BOTTOM_PX);

    if (
      el.scrollTop < LOAD_OLDER_PX &&
      hasOlderMessages &&
      !isLoadingOlder &&
      !prependAnchorRef.current &&
      messages.length > 0
    ) {
      prependAnchorRef.current = {
        prevScrollHeight: el.scrollHeight,
        prevScrollTop: el.scrollTop,
      };
      onLoadOlder();
    }
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    const el = scrollRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior });
  }

  // Restore the viewport when an older page prepends (the first item id
  // changes): keep the previously-visible message where it was.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const firstId = messages[0]?.id ?? null;
    const anchor = prependAnchorRef.current;
    if (el && anchor && firstId !== firstIdRef.current) {
      el.scrollTop =
        anchor.prevScrollTop + (el.scrollHeight - anchor.prevScrollHeight);
      prependAnchorRef.current = null;
    }
    firstIdRef.current = firstId;
  }, [messages]);

  // Auto-follow new content only when the user is already near the bottom, so
  // scrolling up to read history is never interrupted. Also keyed on the
  // virtualizer's total size: rows re-measuring (markdown settling) near the
  // bottom keeps the view pinned.
  useEffect(() => {
    if (prependAnchorRef.current) return;
    if (nearBottom) scrollToBottom('smooth');
  }, [
    messages,
    sending,
    proposal,
    pendingChange,
    pendingExport,
    nearBottom,
    totalSize,
  ]);

  // Jump to the latest message instantly after a conversation loads; a second
  // corrective jump on the next frame catches dynamic measurement settling.
  useEffect(() => {
    if (isLoading || messages.length === 0) return;
    virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    const frame = requestAnimationFrame(() => scrollToBottom('auto'));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (isLoading) {
    return <ChatThreadSkeleton />;
  }

  if (messages.length === 0 && !proposal && !pendingChange && !pendingExport) {
    return <WelcomeScreen onSend={onSendExample} />;
  }

  return (
    <div className='relative flex min-h-0 flex-1 flex-col'>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto'
      >
        {isLoadingOlder ? (
          <div className='flex justify-center pt-4'>
            <Loader2 className='size-4 animate-spin text-muted-foreground' />
          </div>
        ) : null}

        <div className='relative w-full' style={{ height: totalSize }}>
          {virtualizer.getVirtualItems().map((row) => (
            <div
              key={row.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className='absolute left-0 top-0 w-full'
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <div className='mx-auto min-w-0 max-w-3xl px-4 pb-6'>
                <ChatMessage item={messages[row.index]} />
              </div>
            </div>
          ))}
        </div>

        <div className='mx-auto flex min-w-0 max-w-3xl flex-col gap-6 px-4 pb-6'>
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

          {pendingChange ? (
            <div className='duration-300 animate-in fade-in slide-in-from-bottom-2'>
              <ActionProposalCard
                change={pendingChange}
                confirming={confirmingChange}
                onConfirm={onChangeConfirm}
                onCancel={onChangeCancel}
              />
            </div>
          ) : null}

          {pendingExport ? (
            <div className='duration-300 animate-in fade-in slide-in-from-bottom-2'>
              <ExportCard
                export_={pendingExport}
                baseCurrency={baseCurrency}
                preparing={preparingExport}
                onConfirm={onExportConfirm}
                onCancel={onExportCancel}
              />
            </div>
          ) : null}

          {sending ? <TypingIndicator /> : null}
        </div>
      </div>

      {!nearBottom ? (
        <Button
          type='button'
          size='icon'
          variant='outline'
          onClick={() => scrollToBottom('smooth')}
          aria-label={t('message.scrollToLatest')}
          className='absolute bottom-4 right-4 rounded-full shadow-md duration-200 animate-in fade-in zoom-in-95'
        >
          <ChevronDown className='size-4' />
        </Button>
      ) : null}
    </div>
  );
}
