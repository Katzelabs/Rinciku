import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('aiChat');
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const title = conversation
    ? conversation.title?.trim() || t('header.untitled')
    : t('header.newChat');

  function startRename() {
    if (!conversation) return;
    setDraft(conversation.title?.trim() || t('header.untitled'));
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
    <header className='flex items-center justify-between gap-2 border-b px-3 py-2.5'>
      <div className='flex min-w-0 items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden'
          onClick={onOpenHistory}
          aria-label={t('header.openHistory')}
        >
          <PanelLeft className='size-4' />
        </Button>
        <span className='truncate text-sm font-semibold' title={title}>
          {title}
        </span>
      </div>

      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden'
          onClick={onNew}
          aria-label={t('header.newChat')}
        >
          <Plus className='size-4' />
        </Button>

        {conversation ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                aria-label={t('header.options')}
              >
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-40'>
              <DropdownMenuItem onSelect={startRename}>
                <Pencil className='size-4' />
                {t('header.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className='size-4' />
                {t('common:actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('rename.title')}</DialogTitle>
            <DialogDescription>{t('rename.description')}</DialogDescription>
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
            placeholder={t('rename.placeholder')}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRenameOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button onClick={commitRename}>{t('header.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('delete.title')}</DialogTitle>
            <DialogDescription>{t('delete.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              {t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
