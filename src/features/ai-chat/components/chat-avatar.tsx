import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  role: 'user' | 'assistant';
  className?: string;
};

export function ChatAvatar({ role, className }: Props) {
  const isUser = role === 'user';
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full',
        isUser
          ? 'bg-muted text-muted-foreground'
          : 'bg-gradient-to-br from-primary to-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-primary/20',
        className
      )}
      aria-hidden
    >
      {isUser ? <User className='size-4' /> : <Sparkles className='size-4' />}
    </div>
  );
}
