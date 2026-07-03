import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { listConversations } from '../api';
import type { Conversation } from '../types';

export type UseConversationsResult = {
  data: Conversation[] | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

// Backs the conversation-history sheet, newest activity first (the domain
// `listConversations` query sorts by last_message_at desc). Ported from the web
// hook: the same integer-`token` refetch pattern with a `cancelled` cleanup
// guard. `refetch` is called by useChat after every turn so a new/renamed
// conversation surfaces and the list re-sorts. Native addition: a focus refresh
// (there is no window-focus event on mobile), skipping the first focus since the
// mount effect already loaded the list.
export function useConversations(): UseConversationsResult {
  const [data, setData] = useState<Conversation[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listConversations()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setData(undefined);
        } else {
          setError(null);
          setData(data ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const refetch = useCallback(() => setToken((t) => t + 1), []);

  const didFocus = useRef(false);
  useFocusEffect(
    useCallback(() => {
      // Skip the initial focus — the mount effect above already loaded the list,
      // so refetching here would just double-fetch on first render.
      if (!didFocus.current) {
        didFocus.current = true;
        return;
      }
      refetch();
    }, [refetch])
  );

  return { data, isLoading, error, refetch };
}
