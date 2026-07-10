import { useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';

import { aiChatKeys, type ConversationPage } from '@rinciku/domain/ai-chat';

import { CONVERSATIONS_PAGE_SIZE, listConversations } from '../api';
import type { ConversationListItem } from '../types';

export type UseConversationsResult = {
  data: ConversationListItem[] | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

// Flattens the page cache into one list, deduping by id: offset paging can
// briefly show a row on two pages when the list re-sorts between fetches.
function flattenPages(pages: ConversationPage[]): ConversationListItem[] {
  const seen = new Set<string>();
  const items: ConversationListItem[] = [];
  for (const page of pages) {
    for (const item of page.items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    }
  }
  return items;
}

// Backs the conversation-history sheet, newest activity first, one page at a
// time. Writes (turn / rename / delete) patch the react-query cache directly
// via the conversation-pages helpers instead of refetching. Native addition: a
// focus refresh (there is no window-focus event on mobile), skipping the first
// focus since mount already loaded the list.
export function useConversations(): UseConversationsResult {
  const query = useInfiniteQuery({
    queryKey: aiChatKeys.conversations,
    queryFn: async ({ pageParam }) => {
      const { data, count, error } = await listConversations({
        limit: CONVERSATIONS_PAGE_SIZE,
        offset: pageParam,
      });
      if (error || !data) {
        throw error ?? new Error('Could not load conversations');
      }
      return { items: data, count: count ?? 0 } satisfies ConversationPage;
    },
    initialPageParam: 0,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.count ? loaded : undefined;
    },
    // Bounds the cost of refetch-all-pages on invalidate/foreground focus.
    maxPages: 5,
  });

  const data = useMemo(
    () => (query.data ? flattenPages(query.data.pages) : undefined),
    [query.data]
  );

  const refetch = () => void query.refetch();
  const fetchNextPage = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  };

  // react-query returns a stable refetch reference, safe as an effect dep.
  const queryRefetch = query.refetch;
  const didFocus = useRef(false);
  useFocusEffect(
    useCallback(() => {
      // Skip the initial focus — the query itself loads on mount, so refetching
      // here would just double-fetch on first render.
      if (!didFocus.current) {
        didFocus.current = true;
        return;
      }
      void queryRefetch();
    }, [queryRefetch])
  );

  return {
    data,
    isLoading: query.isPending,
    error: query.error ? query.error.message : null,
    refetch,
    fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
