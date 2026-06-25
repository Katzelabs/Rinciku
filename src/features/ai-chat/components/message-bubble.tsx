import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ChatItem } from '../types';
import { ChatAvatar } from './chat-avatar';

const MARKDOWN_CLASS = cn(
  'space-y-2 text-sm leading-relaxed',
  '[&_a]:underline [&_a]:underline-offset-2',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_strong]:font-semibold',
  '[&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]'
);

export function MessageBubble({ item }: { item: ChatItem }) {
  const isUser = item.role === 'user';
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context); fail silently.
    }
  }

  return (
    <div
      className={cn(
        'group flex w-full items-end gap-2 duration-300 animate-in fade-in slide-in-from-bottom-2',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <ChatAvatar role={item.role} />
      <div
        className={cn(
          'relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[75%]',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className='whitespace-pre-wrap'>{item.content}</p>
        ) : (
          <>
            <div className={MARKDOWN_CLASS}>
              <ReactMarkdown>{item.content}</ReactMarkdown>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  onClick={copy}
                  aria-label='Copy message'
                  className='absolute -bottom-3 -right-2 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100'
                >
                  {copied ? (
                    <Check className='size-3.5 text-primary' />
                  ) : (
                    <Copy className='size-3.5' />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>{copied ? 'Copied' : 'Copy'}</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
