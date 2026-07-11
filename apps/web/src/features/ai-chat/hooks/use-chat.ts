import { useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { aiChatKeys } from '@rinciku/domain/ai-chat';
import i18n from '@rinciku/core/i18n';
import { useAuth } from '@/features/auth';
import { upsertConversationInCache } from '../lib/conversation-cache';
import {
  appendToThread,
  replaceThreadItemId,
  seedEmptyThread,
  type ThreadPage,
} from '../lib/thread-cache';
import {
  appendMessage,
  buildBudgetContext,
  buildExportFiles,
  chatImageUrls,
  conversationTitleFrom,
  createConversation,
  createImageAttachment,
  extractText,
  fileToBase64,
  getConversationSummary,
  getMessages,
  maybeSummarizeConversation,
  MESSAGES_PAGE_SIZE,
  parseExport,
  parseProposal,
  resolveChangeTarget,
  resolveExport,
  runAgentTurn,
  summarizeExport,
  summarizeProposal,
  touchConversation,
  uploadChatImage,
  type ChatMessageRowWithImage,
  type MessageCursor,
} from '../api';
import { applyProposedChange, parseChange } from '../agent-tools';
import { downloadCsv, type CurrencyCode } from '@rinciku/core';
import type {
  ChatItem,
  ExportFormat,
  ImageBlock,
  MessageParam,
  PendingAttachment,
  ProposedChange,
  ProposedExport,
  ProposedTransaction,
  TextBlock,
  ToolChoice,
} from '../types';

export type ActiveProposal = {
  proposal: ProposedTransaction;
  attachment: PendingAttachment | null;
};

export type UseChatOptions = {
  // Called once a conversation is lazily created on the first send, so the page
  // can reflect the new id in the URL (/ai-chat/:conversationId).
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
  pendingExport: ProposedExport | null;
  preparingExport: boolean;
  // The profile's base currency, for rendering export stats on the card.
  baseCurrency: CurrencyCode;
  selectConversation: (id: string) => void;
  startNew: () => void;
  send: (text: string) => void;
  sendImage: (file: File, caption?: string) => void;
  dismissProposal: () => void;
  dismissChange: () => void;
  confirmChange: () => void;
  dismissExport: () => void;
  confirmExport: (format: ExportFormat) => void;
  noteConfirmation: (text: string) => void;
};

function tempId(): string {
  return crypto.randomUUID();
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

// Owns the active thread. Loading is driven by explicit handlers (select / new)
// rather than an effect, so there is no reset-on-prop-change. A conversation is
// created lazily on the first send, so opening "New chat" writes nothing.
// `currentIdRef` mirrors the backing conversation id synchronously for the async
// turn flow (setActiveId is async and can't be read back mid-turn).
export function useChat(options: UseChatOptions = {}): UseChatResult {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ActiveProposal | null>(null);
  const [pendingChange, setPendingChange] = useState<ProposedChange | null>(
    null
  );
  const [confirmingChange, setConfirmingChange] = useState(false);
  const [pendingExport, setPendingExport] = useState<ProposedExport | null>(
    null
  );
  const [preparingExport, setPreparingExport] = useState(false);

  const currentIdRef = useRef<string | null>(null);

  // The thread lives in the react-query cache: pages[0] is the newest page,
  // fetchNextPage pulls OLDER pages on scroll-up. Messages are immutable, so
  // loaded pages never go stale; gcTime bounds how long cached signed image
  // URLs (1h TTL) can be served.
  const messagesQuery = useInfiniteQuery({
    queryKey: aiChatKeys.messages(activeId ?? 'none'),
    enabled: !!activeId,
    queryFn: async ({ pageParam }): Promise<ThreadPage> => {
      const { data, count, nextCursor, error } = await getMessages(
        activeId as string,
        { limit: MESSAGES_PAGE_SIZE, before: pageParam ?? undefined }
      );
      if (error || !data) {
        throw error ?? new Error(i18n.t('aiChat:chat.somethingWrong'));
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
    setPendingExport(null);
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
    setPendingExport(null);
    setError(null);
  }

  async function runTurn(params: {
    apiContent: Array<TextBlock | ImageBlock>;
    displayText: string;
    toolChoice: ToolChoice;
    imageFile?: File;
    // Pre-uploaded chat image: persisted on the user message + shown optimistically.
    image?: { attachmentId: string; previewUrl: string };
  }) {
    if (!profile) {
      setError(i18n.t('aiChat:chat.signInRequired'));
      return;
    }
    setError(null);
    setSending(true);

    // History before this turn (text-only — we never replay tool/image blocks).
    const history = messages.map<MessageParam>((it) => ({
      role: it.role,
      content: it.content,
    }));

    try {
      // 1. Ensure a conversation exists (lazy create on first send).
      let convId = currentIdRef.current;
      if (convId == null) {
        const title = conversationTitleFrom(
          params.displayText ||
            (params.image ? i18n.t('aiChat:chat.sharedImage') : '')
        );
        const { data, error } = await createConversation(profile.id, title);
        if (error || !data)
          throw error ?? new Error(i18n.t('aiChat:chat.startError'));
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
        throw ctx.error ?? new Error(i18n.t('aiChat:chat.budgetError'));
      }

      // 4. Agentic loop lives in the shared @rinciku/domain/ai-chat slice: the
      //    model may call read tools (auto-executed there, reusing the
      //    RLS-scoped api factories) and reason over the results before
      //    answering. Write proposals (propose_*) end the loop with a card —
      //    never executed without user confirmation.
      const res = await runAgentTurn(
        {
          system: ctx.data.system,
          history,
          apiContent: params.apiContent,
          toolChoice: params.toolChoice,
          profile,
          summary: summaryRes.data?.summary ?? null,
        },
        { noResponseMessage: i18n.t('aiChat:chat.noResponse') }
      );

      // 5. Resolve the terminal response: a transaction proposal, a generic
      //    change proposal, an export request, or a plain answer. Persist the
      //    assistant text.
      const txProposal = parseProposal(res);
      const change = txProposal ? null : parseChange(res);
      const exportProposal = txProposal || change ? null : parseExport(res);
      const text =
        extractText(res) ||
        (txProposal
          ? summarizeProposal(txProposal)
          : change
            ? change.summary
            : exportProposal
              ? summarizeExport(exportProposal)
              : i18n.t('aiChat:chat.genericResponse'));

      const assistantTempId = tempId();
      appendToThread(queryClient, convId, {
        id: assistantTempId,
        role: 'assistant',
        content: text,
      });
      const savedAssistant = await appendMessage({
        conversation_id: convId,
        user_id: profile.id,
        role: 'assistant',
        content: text,
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

      // 6. Stage a confirmation card. Transaction proposals keep the rich
      //    editable card (and store the image now that we know expense/income);
      //    all other writes use the generic action card.
      if (txProposal) {
        let attachment: PendingAttachment | null = null;
        if (params.imageFile) {
          const created = await createImageAttachment(
            params.imageFile,
            txProposal.kind,
            profile.id
          );
          if (!created.error && created.data) attachment = created.data;
        }
        setProposal({ proposal: txProposal, attachment });
      } else if (change) {
        // Resolve the actual row the update/delete points at (RLS-scoped) so
        // the card shows ground truth, not just the model-written summary.
        setPendingChange(await resolveChangeTarget(change));
      } else if (exportProposal) {
        // Resolve the date window + real row counts so the card shows ground
        // truth ("43 expenses · Rp 3.2jt"), not the model's claim.
        setPendingExport(await resolveExport(exportProposal, profile));
      }

      // Re-sort the cached sidebar list in place (no refetch): the touched
      // conversation moves to the top with the fresh preview.
      const touched = await touchConversation(convId, {
        last_message_at: new Date().toISOString(),
      });
      if (touched.data) {
        upsertConversationInCache(queryClient, {
          ...touched.data,
          last_message_preview: text,
        });
      }

      // Fold older messages into the running summary in the background once
      // the thread outgrows the window (fire-and-forget; never throws).
      void maybeSummarizeConversation(convId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : i18n.t('aiChat:chat.somethingWrong')
      );
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

  function sendImage(file: File, caption?: string) {
    if (sending) return;
    if (!profile) {
      setError(i18n.t('aiChat:chat.signInRequired'));
      return;
    }
    const text = (caption ?? '').trim();
    void (async () => {
      try {
        const { media_type, data } = await fileToBase64(file);
        // Persist the image up front so the sent message shows it (above the
        // text bubble, chat-app style) and reloads it from history later. If the
        // upload fails the turn still proceeds — only the thumbnail is lost.
        const uploaded = await uploadChatImage(file, profile.id);
        const image = uploaded.data
          ? {
              attachmentId: uploaded.data.attachmentId,
              previewUrl: URL.createObjectURL(file),
            }
          : undefined;
        await runTurn({
          apiContent: [
            { type: 'image', source: { type: 'base64', media_type, data } },
            {
              type: 'text',
              text: text || 'Log this transaction from the attached image.',
            },
          ],
          displayText: text,
          toolChoice: { type: 'any' },
          imageFile: file,
          image,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : i18n.t('aiChat:chat.imageReadError')
        );
      }
    })();
  }

  function dismissProposal() {
    setProposal(null);
  }

  function dismissChange() {
    setPendingChange(null);
  }

  function dismissExport() {
    setPendingExport(null);
  }

  // Generates and downloads the confirmed export. The heavy lifting (queries,
  // CSV/xlsx building) lives in the domain layer; downloadXlsx is imported
  // lazily alongside SheetJS so the library never loads until needed.
  function confirmExport(format: ExportFormat) {
    const exp = pendingExport;
    if (!exp || !profile || preparingExport) return;
    setPreparingExport(true);
    setError(null);
    void (async () => {
      try {
        const { data, error } = await buildExportFiles(exp, profile, format);
        if (error || !data) {
          throw error ?? new Error(i18n.t('aiChat:chat.exportError'));
        }
        for (const file of data) {
          if (file.kind === 'csv') {
            downloadCsv(file.filename, file.data);
          } else {
            const { downloadXlsx } = await import('@rinciku/core/xlsx');
            downloadXlsx(file.filename, file.data);
          }
        }
        setPendingExport(null);
        noteConfirmation(
          i18n.t('aiChat:chat.exportDone', {
            files: data.map((f) => f.filename).join(', '),
          })
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : i18n.t('aiChat:chat.exportError')
        );
      } finally {
        setPreparingExport(false);
      }
    })();
  }

  // Applies a confirmed generic change (create/update/delete) via the owning
  // feature's api layer, then notes it in the thread. Read-auto / write-confirm:
  // nothing here runs until the user taps confirm.
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
      .then(({ error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setPendingChange(null);
        noteConfirmation(
          i18n.t('aiChat:chat.done', { summary: change.summary })
        );
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
    pendingExport,
    preparingExport,
    baseCurrency: (profile?.base_currency ?? 'IDR') as CurrencyCode,
    selectConversation,
    startNew,
    send,
    sendImage,
    dismissProposal,
    dismissChange,
    confirmChange,
    dismissExport,
    confirmExport,
    noteConfirmation,
  };
}
