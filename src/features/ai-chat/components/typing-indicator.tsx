import { ChatAvatar } from './chat-avatar';

export function TypingIndicator() {
  return (
    <div className='flex w-full items-end gap-2 duration-300 animate-in fade-in slide-in-from-bottom-2'>
      <ChatAvatar role='assistant' />
      <div className='flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3'>
        <span className='size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]' />
        <span className='size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]' />
        <span className='size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]' />
        <span className='sr-only'>Rinciku is thinking…</span>
      </div>
    </div>
  );
}
