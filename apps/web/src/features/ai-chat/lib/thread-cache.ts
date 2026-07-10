import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { aiChatKeys, type MessageCursor } from '@rinciku/domain/ai-chat';
import type { ChatItem } from '../types';

// The message cache is one infinite query per conversation. pages[0] is the
// NEWEST page (fetched first); scroll-up pagination appends OLDER pages after
// it. Rendering flattens with [...pages].reverse().flatMap(p => p.items).

export type ThreadPage = {
  // Ascending within the page (oldest → newest).
  items: ChatItem[];
  nextCursor: MessageCursor | null;
  count: number;
};

type ThreadData = InfiniteData<ThreadPage, MessageCursor | null>;

// Seeds an empty cache for a lazily created conversation so the mounting query
// (staleTime: Infinity) renders the optimistic items instead of refetching.
export function seedEmptyThread(qc: QueryClient, conversationId: string) {
  qc.setQueryData<ThreadData>(aiChatKeys.messages(conversationId), {
    pages: [{ items: [], nextCursor: null, count: 0 }],
    pageParams: [null],
  });
}

// Appends a new message (optimistic or final) to the newest page.
export function appendToThread(
  qc: QueryClient,
  conversationId: string,
  item: ChatItem
) {
  qc.setQueryData<ThreadData>(aiChatKeys.messages(conversationId), (old) => {
    if (!old || old.pages.length === 0) {
      return {
        pages: [{ items: [item], nextCursor: null, count: 1 }],
        pageParams: [null],
      };
    }
    const [first, ...rest] = old.pages;
    return {
      ...old,
      pages: [
        { ...first, items: [...first.items, item], count: first.count + 1 },
        ...rest,
      ],
    };
  });
}

// Swaps an optimistic temp id for the persisted row id so the cache is
// canonical (stable keys across a later refetch).
export function replaceThreadItemId(
  qc: QueryClient,
  conversationId: string,
  fromId: string,
  toId: string
) {
  qc.setQueryData<ThreadData>(aiChatKeys.messages(conversationId), (old) =>
    old
      ? {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            items: p.items.map((it) =>
              it.id === fromId ? { ...it, id: toId } : it
            ),
          })),
        }
      : old
  );
}
