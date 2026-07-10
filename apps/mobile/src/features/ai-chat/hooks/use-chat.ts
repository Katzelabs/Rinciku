import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import type { CurrencyCode } from '@rinciku/core';
import { aiChatKeys } from '@rinciku/domain/ai-chat';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { upsertConversationInCache } from '../lib/conversation-cache';
import {
  appendToThread,
  replaceThreadItemId,
  seedEmptyThread,
  type ThreadPage,
} from '../lib/thread-cache';
import {
  appendMessage,
  applyProposedChange,
  buildBudgetContext,
  chatImageUrls,
  conversationTitleFrom,
  createConversation,
  extractText,
  getConversationSummary,
  getMessages,
  maybeSummarizeConversation,
  MESSAGES_PAGE_SIZE,
  parseChange,
  parseProposal,
  resolveChangeTarget,
  runAgentTurn,
  summarizeProposal,
  touchConversation,
  type MessageCursor,
} from '../api';
import {
  createImageAttachment,
  type PickedImage,
  uploadChatImage,
} from '../lib/image';
import type {
  ChatItem,
  ChatMessageRowWithImage,
  ImageBlock,
  MessageParam,
  PendingAttachment,
  ProposedChange,
  ProposedTransaction,
  TextBlock,
  ToolChoice,
} from '../types';

export type ActiveProposal = {
  proposal: ProposedTransaction;
  attachment: PendingAttachment | null;
};

export type UseChatOptions = {
  // Called once a conversation is lazily created on the first send.
  onConversationCreated?: (id: string) => void;
};

export type UseChatResult = {
  activeId: string | null;
  messages: ChatItem[];
  isLoading: boolean;
  sending: boolean;
  error: string | null;
  // Scroll-up pagination over the thread (older pages, newest loaded first).
  hasOlderMessages: boolean;
  isLoadingOlder: boolean;
  loadOlderMessages: () => void;
  proposal: ActiveProposal | null;
  pendingChange: ProposedChange | null;
  confirmingChange: boolean;
  selectConversation: (id: string) => void;
  startNew: () => void;
  send: (text: string) => void;
  sendImage: (asset: PickedImage, caption?: string) => void;
  dismissProposal: () => void;
  dismissChange: () => void;
  confirmChange: () => void;
  noteConfirmation: (text: string) => void;
};

let seq = 0;
function tempId(): string {
  seq += 1;
  return `tmp-${seq}-${Math.round(Math.random() * 1e9)}`;
}

// Resolves signed URLs for messages that carry an image attachment so reloaded
// threads render their images — one batched storage call per page of rows.
async function rowsToItems(
  rows: ChatMessageRowWithImage[]
): Promise<ChatItem[]> {
  const paths = rows
    .map((row) => row.attachment?.storage_path)
    .filter((p): p is string => !!p);
  const urls = await chatImageUrls(paths);
  return rows.map((row) => {
    const storagePath = row.attachment?.storage_path ?? null;
    return {
      id: row.id,
      role: row.role === 'assistant' ? 'assistant' : 'user',
      content: row.content,
      imageUrl: storagePath ? (urls.get(storagePath) ?? null) : null,
    } satisfies ChatItem;
  });
}

// Owns the active thread on native. Loading is driven by explicit handlers
// (select / new) rather than an effect. A conversation is created lazily on the
// first send, so opening "New chat" writes nothing. `currentIdRef` mirrors the
// backing id synchronously for the async turn flow. The agentic loop itself
// lives in the shared @rinciku/domain/ai-chat slice (runAgentTurn).
export function useChat(options: UseChatOptions = {}): UseChatResult {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation('aiChat');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ActiveProposal | null>(null);
  const [pendingChange, setPendingChange] = useState<ProposedChange | null>(
    null
  );
  const [confirmingChange, setConfirmingChange] = useState(false);

  const currentIdRef = useRef<string | null>(null);

  // The thread lives in the react-query cache: pages[0] is the newest page,
  // fetchNextPage pulls OLDER pages on scroll-up. Messages are immutable, so
  // loaded pages never go stale; gcTime bounds how long cached signed image
  // URLs (1h TTL) can be served.
  const messagesQuery = useInfiniteQuery({
    queryKey: aiChatKeys.messages(activeId ?? 'none'),
    enabled: !!activeId,
    queryFn: async ({ pageParam }): Promise<ThreadPage> => {
      const {
        data,
        count,
        nextCursor,
        error: loadError,
      } = await getMessages(activeId as string, {
        limit: MESSAGES_PAGE_SIZE,
        before: pageParam ?? undefined,
      });
      if (loadError || !data) {
        throw loadError ?? new Error(t('chat.somethingWrong'));
      }
      return {
        items: await rowsToItems(data),
        nextCursor,
        count: count ?? 0,
      };
    },
    initialPageParam: null as MessageCursor | null,
    getNextPageParam: (page) => page.nextCursor,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });

  const messages = useMemo<ChatItem[]>(() => {
    const pages = messagesQuery.data?.pages;
    if (!pages) return [];
    return [...pages].reverse().flatMap((p) => p.items);
  }, [messagesQuery.data]);

  const isLoading = !!activeId && messagesQuery.isPending;

  function loadOlderMessages() {
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      void messagesQuery.fetchNextPage();
    }
  }

  function startNew() {
    currentIdRef.current = null;
    setActiveId(null);
    setProposal(null);
    setPendingChange(null);
    setError(null);
  }

  // Loading is owned by the query (keyed on the id), so switching threads is
  // just a state reset — no imperative fetch, no stale-load races.
  function selectConversation(id: string) {
    if (currentIdRef.current === id) return;
    currentIdRef.current = id;
    setActiveId(id);
    setProposal(null);
    setPendingChange(null);
    setError(null);
  }

  async function runTurn(params: {
    apiContent: Array<TextBlock | ImageBlock>;
    displayText: string;
    toolChoice: ToolChoice;
    // Picked image whose kind-specific attachment is created after extraction.
    imageAsset?: PickedImage;
    // Pre-uploaded chat image: persisted on the user message + shown optimistically.
    image?: { attachmentId: string; previewUrl: string };
  }) {
    if (!profile) {
      setError(t('chat.signInRequired'));
      return;
    }
    setError(null);
    setSending(true);

    // History before this turn (text-only — tool/image blocks are never replayed).
    const history = messages.map<MessageParam>((it) => ({
      role: it.role,
      content: it.content,
    }));

    try {
      // 1. Ensure a conversation exists (lazy create on first send).
      let convId = currentIdRef.current;
      if (convId == null) {
        const title = conversationTitleFrom(params.displayText);
        const { data, error: createError } = await createConversation(
          profile.id,
          title
        );
        if (createError || !data)
          throw createError ?? new Error(t('chat.startError'));
        convId = data.id;
        currentIdRef.current = convId;
        // Seed an empty page cache BEFORE activating the id: the mounting
        // query (staleTime: Infinity) then renders the optimistic items below
        // instead of refetching over them.
        seedEmptyThread(queryClient, convId);
        setActiveId(convId);
        options.onConversationCreated?.(convId);
      }

      // 2. Optimistic user bubble + persist (swap in the real row id after).
      const userTempId = tempId();
      appendToThread(queryClient, convId, {
        id: userTempId,
        role: 'user',
        content: params.displayText,
        imageUrl: params.image?.previewUrl ?? null,
      });
      const savedUser = await appendMessage({
        conversation_id: convId,
        user_id: profile.id,
        role: 'user',
        content: params.displayText,
        attachment_id: params.image?.attachmentId ?? null,
      });
      if (savedUser.data) {
        replaceThreadItemId(queryClient, convId, userTempId, savedUser.data.id);
      }

      // 3. Ground in the current budget state, plus the running summary of any
      //    messages older than the verbatim history window.
      const [ctx, summaryRes] = await Promise.all([
        buildBudgetContext(profile),
        getConversationSummary(convId),
      ]);
      if (ctx.error || !ctx.data) {
        throw ctx.error ?? new Error(t('chat.budgetError'));
      }

      // 4. Run the shared agentic loop. Write proposals end the loop with a
      //    card; nothing is written until the user confirms.
      const res = await runAgentTurn(
        {
          system: ctx.data.system,
          history,
          apiContent: params.apiContent,
          toolChoice: params.toolChoice,
          profile,
          summary: summaryRes.data?.summary ?? null,
        },
        { noResponseMessage: t('chat.noResponse') }
      );

      // 5. Resolve the terminal response and persist the assistant text.
      const txProposal = parseProposal(res);
      const change = txProposal ? null : parseChange(res);
      const answer =
        extractText(res) ||
        (txProposal
          ? summarizeProposal(txProposal)
          : change
            ? change.summary
            : t('chat.genericResponse'));

      const assistantTempId = tempId();
      appendToThread(queryClient, convId, {
        id: assistantTempId,
        role: 'assistant',
        content: answer,
      });
      const savedAssistant = await appendMessage({
        conversation_id: convId,
        user_id: profile.id,
        role: 'assistant',
        content: answer,
        model: res.model ?? null,
        tokens_input: res.usage?.input_tokens ?? null,
        tokens_output: res.usage?.output_tokens ?? null,
      });
      if (savedAssistant.data) {
        replaceThreadItemId(
          queryClient,
          convId,
          assistantTempId,
          savedAssistant.data.id
        );
      }

      // 6. Stage a confirmation card. For an image turn, create the kind-specific
      //    attachment now (expense vs income live in separate tables/buckets) so
      //    confirming links it to the created record.
      if (txProposal) {
        let attachment: PendingAttachment | null = null;
        if (params.imageAsset) {
          const created = await createImageAttachment(
            params.imageAsset,
            txProposal.kind,
            profile.id
          );
          attachment = created.data;
        }
        setProposal({ proposal: txProposal, attachment });
      } else if (change) {
        // Resolve the actual row the update/delete points at (RLS-scoped) so
        // the card shows ground truth, not just the model-written summary.
        setPendingChange(await resolveChangeTarget(change));
      }

      // Re-sort the cached history list in place (no refetch): the touched
      // conversation moves to the top with the fresh preview.
      const touched = await touchConversation(convId, {
        last_message_at: new Date().toISOString(),
      });
      if (touched.data) {
        upsertConversationInCache(queryClient, {
          ...touched.data,
          last_message_preview: answer,
        });
      }

      // Fold older messages into the running summary in the background once
      // the thread outgrows the window (fire-and-forget; never throws).
      void maybeSummarizeConversation(convId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('chat.somethingWrong'));
    } finally {
      setSending(false);
    }
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    void runTurn({
      apiContent: [{ type: 'text', text: trimmed }],
      displayText: trimmed,
      toolChoice: { type: 'auto' },
    });
  }

  // Sends a receipt/transfer image. Uploads it up front so the user bubble shows
  // the thumbnail (and reloads via chatImageUrl later), then forces a tool call
  // so the model proposes a transaction from it.
  function sendImage(asset: PickedImage, caption?: string) {
    if (sending) return;
    if (!profile) {
      setError(t('chat.signInRequired'));
      return;
    }
    const text = caption?.trim() ?? '';
    void (async () => {
      const uploaded = await uploadChatImage(asset, profile.id);
      const image = uploaded.data
        ? { attachmentId: uploaded.data.attachmentId, previewUrl: asset.uri }
        : undefined;
      await runTurn({
        apiContent: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: asset.mimeType,
              data: asset.base64,
            },
          },
          {
            type: 'text',
            text: text || 'Log this transaction from the attached image.',
          },
        ],
        displayText: text,
        toolChoice: { type: 'any' },
        imageAsset: asset,
        image,
      });
    })();
  }

  function dismissProposal() {
    setProposal(null);
  }

  function dismissChange() {
    setPendingChange(null);
  }

  // Applies a confirmed generic change via the shared api layer, then notes it
  // in the thread. Nothing runs until the user taps confirm.
  function confirmChange() {
    const change = pendingChange;
    if (!change || !profile || confirmingChange) return;
    // Fail closed: never apply against a target that didn't resolve (the card
    // disables confirm for these; this guards the hook itself).
    if (change.target && change.target.status !== 'found') return;
    setConfirmingChange(true);
    setError(null);
    const base = (profile.base_currency ?? 'IDR') as CurrencyCode;
    void applyProposedChange(change, profile.id, base)
      .then(({ error: applyError }) => {
        if (applyError) {
          setError(applyError.message);
          return;
        }
        setPendingChange(null);
        noteConfirmation(t('chat.done', { summary: change.summary }));
      })
      .finally(() => setConfirmingChange(false));
  }

  // Appends + persists a short confirmation note after a proposal is saved.
  function noteConfirmation(text: string) {
    setProposal(null);
    const convId = currentIdRef.current;
    if (convId && profile) {
      const noteTempId = tempId();
      appendToThread(queryClient, convId, {
        id: noteTempId,
        role: 'assistant',
        content: text,
      });
      void appendMessage({
        conversation_id: convId,
        user_id: profile.id,
        role: 'assistant',
        content: text,
      }).then(async (savedNote) => {
        if (savedNote.data) {
          replaceThreadItemId(
            queryClient,
            convId,
            noteTempId,
            savedNote.data.id
          );
        }
        const touched = await touchConversation(convId, {
          last_message_at: new Date().toISOString(),
        });
        if (touched.data) {
          upsertConversationInCache(queryClient, {
            ...touched.data,
            last_message_preview: text,
          });
        }
      });
    }
  }

  return {
    activeId,
    messages,
    isLoading,
    sending,
    error: error ?? (messagesQuery.error ? messagesQuery.error.message : null),
    hasOlderMessages: messagesQuery.hasNextPage,
    isLoadingOlder: messagesQuery.isFetchingNextPage,
    loadOlderMessages,
    proposal,
    pendingChange,
    confirmingChange,
    selectConversation,
    startNew,
    send,
    sendImage,
    dismissProposal,
    dismissChange,
    confirmChange,
    noteConfirmation,
  };
}
