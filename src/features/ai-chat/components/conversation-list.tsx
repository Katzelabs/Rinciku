import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { Conversation } from '../types';

type Props = {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
};

export function ConversationList({
  conversations,
  isLoading,
  activeId,
  onSelect,
  onNew,
}: Props) {
  return (
    <div className='flex h-full flex-col'>
      <div className='p-3'>
        <Button className='w-full justify-start' variant='outline' onClick={onNew}>
          <Plus className='size-4' />
          New chat
        </Button>
      </div>
      <div className='flex-1 overflow-y-auto px-2 pb-2'>
        {isLoading ? (
          <div className='flex justify-center p-4 text-muted-foreground'>
            <Spinner className='size-4' />
          </div>
        ) : conversations && conversations.length > 0 ? (
          <ul className='space-y-1'>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type='button'
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    'w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors',
                    c.id === activeId
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {c.title?.trim() || 'Untitled chat'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className='px-3 py-4 text-sm text-muted-foreground'>
            No conversations yet.
          </p>
        )}
      </div>
    </div>
  );
}
