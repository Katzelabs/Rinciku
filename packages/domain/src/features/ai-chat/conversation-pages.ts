import type { ConversationListItem } from './types';

// Pure updaters for the paginated conversation-list cache (an array of
// { items, count } pages, as held by each app's useInfiniteQuery). They let the
// apps apply a turn/rename/delete to the cached list directly instead of
// refetching every page after each write. No react-query dependency — the shape
// is plain data, so the helpers stay portable and testable.

export type ConversationPage = {
  items: ConversationListItem[];
  count: number;
};

// Moves (or inserts) a conversation to the top of the first page — the list is
// ordered by last activity, so any touched conversation belongs first.
export function upsertConversationTop(
  pages: ConversationPage[],
  item: ConversationListItem
): ConversationPage[] {
  const existed = pages.some((p) => p.items.some((c) => c.id === item.id));
  const stripped = pages.map((p) => ({
    ...p,
    items: p.items.filter((c) => c.id !== item.id),
  }));
  return stripped.map((p, i) => ({
    items: i === 0 ? [item, ...p.items] : p.items,
    count: existed ? p.count : p.count + 1,
  }));
}

// Applies a field patch (e.g. a rename) in place, wherever the row lives.
export function patchConversation(
  pages: ConversationPage[],
  id: string,
  patch: Partial<ConversationListItem>
): ConversationPage[] {
  return pages.map((p) => ({
    ...p,
    items: p.items.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }));
}

export function removeConversation(
  pages: ConversationPage[],
  id: string
): ConversationPage[] {
  const existed = pages.some((p) => p.items.some((c) => c.id === id));
  return pages.map((p) => ({
    items: p.items.filter((c) => c.id !== id),
    count: existed ? Math.max(0, p.count - 1) : p.count,
  }));
}
