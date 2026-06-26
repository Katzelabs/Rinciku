import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatItem } from '../types';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';

/** Small "Rinciku" glyph + label that heads every assistant turn. */
export function AssistantLabel() {
  return (
    <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground'>
      <span className='flex size-5 items-center justify-center rounded-md bg-gradient-to-br from-primary to-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-primary/20'>
        <Sparkles className='size-3' />
      </span>
      Rinciku
    </div>
  );
}

export function ChatMessage({ item }: { item: ChatItem }) {
  const isUser = item.role === 'user';

  if (isUser) {
    return (
      <div className='flex w-full justify-end duration-300 animate-in fade-in slide-in-from-bottom-1'>
        <div className='max-w-[80%] rounded-3xl rounded-br-md bg-muted px-4 py-2.5 text-base text-foreground'>
          <p className={cn('whitespace-pre-wrap', '[overflow-wrap:anywhere]')}>
            {item.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='group/msg flex w-full flex-col gap-2 duration-300 animate-in fade-in slide-in-from-bottom-1'>
      <AssistantLabel />
      <Markdown content={item.content} />
      <MessageActions content={item.content} />
    </div>
  );
}
