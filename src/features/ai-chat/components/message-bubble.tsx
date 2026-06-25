import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { ChatItem } from '../types';

const MARKDOWN_CLASS = cn(
  'space-y-2 text-sm leading-relaxed',
  '[&_a]:underline [&_a]:underline-offset-2',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_strong]:font-semibold',
  '[&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]'
);

export function MessageBubble({ item }: { item: ChatItem }) {
  const isUser = item.role === 'user';
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className='whitespace-pre-wrap'>{item.content}</p>
        ) : (
          <div className={MARKDOWN_CLASS}>
            <ReactMarkdown>{item.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
