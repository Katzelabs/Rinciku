import { useState } from 'react';
import { MoreHorizontal, PanelLeft, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import type { Conversation } from '../types';

type Props = {
  conversation: Conversation | null;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onOpenHistory: () => void;
};

export function ChatHeader({
  conversation,
  onRename,
  onDelete,
  onNew,
  onOpenHistory,
}: Props) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const title = conversation
    ? conversation.title?.trim() || 'Untitled chat'
    : 'New chat';

  function startRename() {
    if (!conversation) return;
    setDraft(conversation.title?.trim() || 'Untitled chat');
    setRenameOpen(true);
  }

  function commitRename() {
    if (!conversation) return;
    const next = draft.trim();
    setRenameOpen(false);
    if (next && next !== (conversation.title?.trim() ?? '')) {
      onRename(conversation.id, next);
    }
  }

  function confirmDelete() {
    if (conversation) onDelete(conversation.id);
    setDeleteOpen(false);
  }

  return (
    <header className='flex items-center justify-between gap-2 border-b px-3 py-2'>
      <div className='flex min-w-0 items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden'
          onClick={onOpenHistory}
          aria-label='Open conversation history'
        >
          <PanelLeft className='size-4' />
        </Button>
        <span className='truncate text-sm font-medium' title={title}>
          {title}
        </span>
      </div>

      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden'
          onClick={onNew}
          aria-label='New chat'
        >
          <Plus className='size-4' />
        </Button>

        {conversation ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' aria-label='Chat options'>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-40'>
              <DropdownMenuItem onSelect={startRename}>
                <Pencil className='size-4' />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className='size-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>
              Give this conversation a name you'll recognize later.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitRename();
              }
            }}
            placeholder='Chat name'
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={commitRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription>
              This permanently removes this chat and all of its messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
