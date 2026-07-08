import { useCallback, useEffect, useState } from 'react';
import { listConversations } from '../api';
import type { ConversationListItem } from '../types';

export type UseConversationsResult = {
  data: ConversationListItem[] | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

// Sidebar conversation list, newest activity first. `refetch` is called after a
// turn so the list re-sorts and a newly created conversation appears.
export function useConversations(): UseConversationsResult {
  const [data, setData] = useState<ConversationListItem[] | undefined>(
    undefined
  );
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

  return { data, isLoading, error, refetch };
}
