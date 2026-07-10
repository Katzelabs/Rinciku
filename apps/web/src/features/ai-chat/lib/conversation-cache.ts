import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import {
  aiChatKeys,
  patchConversation,
  removeConversation,
  upsertConversationTop,
  type ConversationPage,
} from '@rinciku/domain/ai-chat';
import type { ConversationListItem } from '../types';

// Targeted updates to the cached conversation list, so a turn / rename / delete
// re-sorts the sidebar instantly without refetching every loaded page.

type ListData = InfiniteData<ConversationPage>;

export function upsertConversationInCache(
  qc: QueryClient,
  item: ConversationListItem
) {
  qc.setQueryData<ListData>(aiChatKeys.conversations, (old) =>
    old ? { ...old, pages: upsertConversationTop(old.pages, item) } : old
  );
}

export function patchConversationInCache(
  qc: QueryClient,
  id: string,
  patch: Partial<ConversationListItem>
) {
  qc.setQueryData<ListData>(aiChatKeys.conversations, (old) =>
    old ? { ...old, pages: patchConversation(old.pages, id, patch) } : old
  );
}

export function removeConversationFromCache(qc: QueryClient, id: string) {
  qc.setQueryData<ListData>(aiChatKeys.conversations, (old) =>
    old ? { ...old, pages: removeConversation(old.pages, id) } : old
  );
  // Drop the deleted thread's message pages too.
  qc.removeQueries({ queryKey: aiChatKeys.messages(id) });
}
