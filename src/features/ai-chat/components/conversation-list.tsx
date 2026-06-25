import { useState } from 'react';
import { differenceInCalendarDays, isToday, isYesterday } from 'date-fns';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Conversation } from '../types';

type Props = {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

const GROUP_ORDER = [
  'Today',
  'Yesterday',
  'Previous 7 days',
  'Previous 30 days',
  'Older',
] as const;

type GroupLabel = (typeof GROUP_ORDER)[number];

function bucketFor(value: string | null): GroupLabel {
  if (!value) return 'Older';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Older';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 7) return 'Previous 7 days';
  if (days <= 30) return 'Previous 30 days';
  return 'Older';
}

function groupConversations(items: Conversation[]) {
  const map = new Map<GroupLabel, Conversation[]>();
  for (const c of items) {
    const key = bucketFor(c.last_message_at ?? c.created_at);
    const list = map.get(key);
    if (list) list.push(c);
    else map.set(key, [c]);
  }
  return GROUP_ORDER.filter((g) => map.has(g)).map((label) => ({
    label,
    items: map.get(label)!,
  }));
}

export function ConversationList({
  conversations,
  isLoading,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null);

  function startRename(c: Conversation) {
    setRenamingId(c.id);
    setDraft(c.title?.trim() || 'Untitled chat');
  }

  function commitRename(original: Conversation) {
    const id = original.id;
    const title = draft.trim();
    setRenamingId(null);
    if (title && title !== (original.title?.trim() ?? '')) {
      onRename(id, title);
    }
  }

  function confirmDelete() {
    if (pendingDelete) onDelete(pendingDelete.id);
    setPendingDelete(null);
  }

  const groups =
    conversations && conversations.length > 0
      ? groupConversations(conversations)
      : [];

  return (
    <div className='flex h-full flex-col'>
      <div className='p-3'>
        <Button
          className='w-full justify-start'
          variant='outline'
          onClick={onNew}
        >
          <Plus className='size-4' />
          New chat
        </Button>
      </div>
      <div className='flex-1 overflow-y-auto px-2 pb-2'>
        {isLoading ? (
          <div className='space-y-1'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='px-3 py-2'>
                <Skeleton className='h-4 w-full' />
              </div>
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className='space-y-3'>
            {groups.map((group) => (
              <div key={group.label} className='space-y-1'>
                <p className='px-3 pt-1 text-xs font-medium text-muted-foreground'>
                  {group.label}
                </p>
                <ul className='space-y-0.5'>
                  {group.items.map((c) => {
                    const isActive = c.id === activeId;
                    const isRenaming = renamingId === c.id;
                    return (
                      <li key={c.id} className='group/item relative'>
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={() => commitRename(c)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitRename(c);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setRenamingId(null);
                              }
                            }}
                            className='w-full rounded-md border border-ring bg-background px-3 py-2 text-sm ring-[3px] ring-ring/50 outline-none'
                          />
                        ) : (
                          <>
                            <button
                              type='button'
                              onClick={() => onSelect(c.id)}
                              className={cn(
                                'w-full truncate rounded-md py-2 pr-9 pl-3 text-left text-sm transition-colors',
                                isActive
                                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                  : 'hover:bg-muted'
                              )}
                            >
                              {c.title?.trim() || 'Untitled chat'}
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type='button'
                                  aria-label='Conversation options'
                                  className={cn(
                                    'absolute top-1.5 right-1 flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover/item:opacity-100 data-[state=open]:opacity-100',
                                    isActive && 'opacity-100'
                                  )}
                                >
                                  <MoreHorizontal className='size-4' />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='w-40'>
                                <DropdownMenuItem
                                  onSelect={() => startRename(c)}
                                >
                                  <Pencil className='size-4' />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant='destructive'
                                  onSelect={() => setPendingDelete(c)}
                                >
                                  <Trash2 className='size-4' />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className='px-3 py-4 text-sm text-muted-foreground'>
            No conversations yet.
          </p>
        )}
      </div>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription>
              This permanently removes this chat and all of its messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
