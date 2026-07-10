import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { differenceInCalendarDays, isToday, isYesterday } from 'date-fns';
import {
  Loader2,
  MessagesSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatRelativeTime } from '@rinciku/core';
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
import type { ConversationListItem } from '../types';

type Props = {
  conversations: ConversationListItem[] | undefined;
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  // Infinite scroll over the paginated list.
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

// Stable group keys (ordered); display labels resolve via t('list.groups.<key>').
const GROUP_ORDER = [
  'today',
  'yesterday',
  'previous7Days',
  'previous30Days',
  'older',
] as const;

type GroupLabel = (typeof GROUP_ORDER)[number];

function bucketFor(value: string | null): GroupLabel {
  if (!value) return 'older';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'older';
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 7) return 'previous7Days';
  if (days <= 30) return 'previous30Days';
  return 'older';
}

// One flat row per group header / conversation, so a single virtualizer can
// render the date-grouped list.
type Row =
  | { kind: 'header'; label: GroupLabel; key: string }
  | { kind: 'item'; c: ConversationListItem; key: string };

function flattenToRows(items: ConversationListItem[]): Row[] {
  const map = new Map<GroupLabel, ConversationListItem[]>();
  for (const c of items) {
    const key = bucketFor(c.last_message_at ?? c.created_at);
    const list = map.get(key);
    if (list) list.push(c);
    else map.set(key, [c]);
  }
  const rows: Row[] = [];
  for (const label of GROUP_ORDER) {
    const group = map.get(label);
    if (!group) continue;
    rows.push({ kind: 'header', label, key: `header-${label}` });
    for (const c of group) rows.push({ kind: 'item', c, key: c.id });
  }
  return rows;
}

export function ConversationList({
  conversations,
  isLoading,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: Props) {
  // React Compiler can't analyze @tanstack/react-virtual's subscription model;
  // opt out explicitly — the virtualizer bounds render cost itself.
  'use no memo';
  const { t } = useTranslation('aiChat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pendingDelete, setPendingDelete] =
    useState<ConversationListItem | null>(null);

  function startRename(c: ConversationListItem) {
    setRenamingId(c.id);
    setDraft(c.title?.trim() || t('header.untitled'));
  }

  function commitRename(original: ConversationListItem) {
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

  const rows =
    conversations && conversations.length > 0
      ? flattenToRows(conversations)
      : [];

  // eslint-disable-next-line react-hooks/incompatible-library -- covered by the 'use no memo' opt-out above
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (rows[index].kind === 'header' ? 32 : 56),
    overscan: 10,
    getItemKey: (index) => rows[index].key,
    paddingEnd: 8,
  });

  // Fetch the next page when the viewport nears the end of the loaded rows.
  const virtualItems = virtualizer.getVirtualItems();
  const lastVisibleIndex = virtualItems[virtualItems.length - 1]?.index ?? -1;
  useEffect(() => {
    if (
      lastVisibleIndex >= rows.length - 3 &&
      rows.length > 0 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      onLoadMore?.();
    }
  }, [
    lastVisibleIndex,
    rows.length,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
  ]);

  function renderRow(row: Row) {
    if (row.kind === 'header') {
      return (
        <p className='px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground'>
          {t(`list.groups.${row.label}`)}
        </p>
      );
    }
    const c = row.c;
    const isActive = c.id === activeId;
    const isRenaming = renamingId === c.id;
    return (
      <div className='group/item relative py-0.5'>
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
                'flex w-full flex-col gap-0.5 rounded-md py-2 pr-9 pl-3 text-left transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <span className='flex items-baseline gap-2'>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    isActive && 'font-medium'
                  )}
                >
                  {c.title?.trim() || t('header.untitled')}
                </span>
                <time className='shrink-0 text-[11px] text-muted-foreground'>
                  {formatRelativeTime(c.last_message_at ?? c.created_at)}
                </time>
              </span>
              {c.last_message_preview?.trim() ? (
                <span className='truncate text-xs text-muted-foreground'>
                  {c.last_message_preview.trim()}
                </span>
              ) : null}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  aria-label={t('list.options')}
                  className={cn(
                    'absolute top-2 right-1 flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover/item:opacity-100 data-[state=open]:opacity-100',
                    isActive && 'opacity-100'
                  )}
                >
                  <MoreHorizontal className='size-4' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-40'>
                <DropdownMenuItem onSelect={() => startRename(c)}>
                  <Pencil className='size-4' />
                  {t('header.rename')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant='destructive'
                  onSelect={() => setPendingDelete(c)}
                >
                  <Trash2 className='size-4' />
                  {t('common:actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='p-3'>
        <Button
          variant='outline'
          className='w-full justify-start rounded-full'
          onClick={onNew}
        >
          <Plus className='size-4' />
          {t('list.newChat')}
        </Button>
      </div>
      <div ref={scrollRef} className='flex-1 overflow-y-auto px-2 pb-2'>
        {isLoading ? (
          <div className='space-y-1'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='px-3 py-2'>
                <Skeleton className='h-4 w-full' />
              </div>
            ))}
          </div>
        ) : rows.length > 0 ? (
          <>
            <div
              className='relative w-full'
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualItems.map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className='absolute left-0 top-0 w-full'
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {renderRow(rows[virtualRow.index])}
                </div>
              ))}
            </div>
            {isFetchingNextPage ? (
              <div className='flex justify-center py-2'>
                <Loader2 className='size-4 animate-spin text-muted-foreground' />
              </div>
            ) : null}
          </>
        ) : (
          <div className='flex flex-col items-center gap-2 px-6 py-10 text-center'>
            <div className='flex size-10 items-center justify-center rounded-full bg-muted'>
              <MessagesSquare className='size-5 text-muted-foreground' />
            </div>
            <p className='text-sm font-medium'>{t('list.empty')}</p>
            <p className='text-xs text-muted-foreground'>
              {t('list.emptyHint')}
            </p>
          </div>
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
            <DialogTitle>{t('delete.title')}</DialogTitle>
            <DialogDescription>{t('delete.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPendingDelete(null)}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              {t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
