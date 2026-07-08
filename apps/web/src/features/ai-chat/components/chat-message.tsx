import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatItem } from '../types';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';

/** Small "Rinciku" glyph + label that heads every assistant turn. */
export function AssistantLabel() {
  return (
    <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground'>
      <span className='flex size-5 items-center justify-center rounded-md bg-muted'>
        <Sparkles className='size-3 text-primary' />
      </span>
      Rinciku
    </div>
  );
}

export function ChatMessage({ item }: { item: ChatItem }) {
  const { t } = useTranslation('aiChat');
  const isUser = item.role === 'user';

  if (isUser) {
    return (
      <div className='flex w-full flex-col items-end gap-1.5 duration-300 animate-in fade-in slide-in-from-bottom-1'>
        {item.imageUrl ? (
          <a
            href={item.imageUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='block max-w-[75%] overflow-hidden rounded-2xl rounded-br-md border bg-muted'
          >
            <img
              src={item.imageUrl}
              alt={t('message.imageAlt')}
              className='max-h-80 w-full object-cover'
            />
          </a>
        ) : null}
        {item.content ? (
          <div className='max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-base text-primary-foreground'>
            <p
              className={cn('whitespace-pre-wrap', '[overflow-wrap:anywhere]')}
            >
              {item.content}
            </p>
          </div>
        ) : null}
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
