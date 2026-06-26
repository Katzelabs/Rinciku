import { useRef, useState } from 'react';
import { useAuth } from '@/features/auth';
import {
  appendMessage,
  buildBudgetContext,
  chatImageUrl,
  conversationTitleFrom,
  createConversation,
  createImageAttachment,
  extractText,
  fileToBase64,
  getMessages,
  parseProposal,
  sendChat,
  summarizeProposal,
  touchConversation,
  uploadChatImage,
  type ChatMessageRowWithImage,
} from '../api';
import {
  AGENT_TOOLS,
  applyProposedChange,
  executeReadTool,
  isWriteTool,
  parseChange,
} from '../agent-tools';
import type { CurrencyCode } from '@/lib/fx';
import type {
  ChatItem,
  ChatResponse,
  ImageBlock,
  MessageParam,
  PendingAttachment,
  ProposedChange,
  ProposedTransaction,
  TextBlock,
  ToolChoice,
  ToolResultBlock,
  ToolUseBlock,
} from '../types';

// Bounds the read-tool loop so a misbehaving model can't spin forever. Each
// step is one model round-trip; reads in between are auto-executed.
const MAX_STEPS = 6;

export type ActiveProposal = {
  proposal: ProposedTransaction;
  attachment: PendingAttachment | null;
};

export type UseChatOptions = {
  // Called after any write so the page can re-sort / refresh the sidebar list.
  onConversationsChanged?: () => void;
};

export type UseChatResult = {
  activeId: string | null;
  messages: ChatItem[];
  isLoading: boolean;
  sending: boolean;
  error: string | null;
  proposal: ActiveProposal | null;
  pendingChange: ProposedChange | null;
  confirmingChange: boolean;
  selectConversation: (id: string) => void;
  startNew: () => void;
  send: (text: string) => void;
  sendImage: (file: File, caption?: string) => void;
  dismissProposal: () => void;
  dismissChange: () => void;
  confirmChange: () => void;
  noteConfirmation: (text: string) => void;
};

function tempId(): string {
  return crypto.randomUUID();
}

// Resolves a signed URL for each message that carries an image attachment so
// reloaded threads render their images. Text-only rows resolve to null.
async function rowsToItems(
  rows: ChatMessageRowWithImage[]
): Promise<ChatItem[]> {
  return Promise.all(
    rows.map(async (row) => {
      const storagePath = row.attachment?.storage_path ?? null;
      return {
        id: row.id,
        role: row.role === 'assistant' ? 'assistant' : 'user',
        content: row.content,
        imageUrl: storagePath ? await chatImageUrl(storagePath) : null,
      } satisfies ChatItem;
    })
  );
}

// Owns the active thread. Loading is driven by explicit handlers (select / new)
// rather than an effect, so there is no reset-on-prop-change. A conversation is
// created lazily on the first send, so opening "New chat" writes nothing.
// `currentIdRef` mirrors the backing conversation id synchronously for the async
// turn flow (setActiveId is async and can't be read back mid-turn).
export function useChat(options: UseChatOptions = {}): UseChatResult {
  const { profile } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ActiveProposal | null>(null);
  const [pendingChange, setPendingChange] = useState<ProposedChange | null>(
    null
  );
  const [confirmingChange, setConfirmingChange] = useState(false);

  const currentIdRef = useRef<string | null>(null);

  function startNew() {
    currentIdRef.current = null;
    setActiveId(null);
    setMessages([]);
    setProposal(null);
    setPendingChange(null);
    setError(null);
  }

  function selectConversation(id: string) {
    if (currentIdRef.current === id) return;
    currentIdRef.current = id;
    setActiveId(id);
    setProposal(null);
    setPendingChange(null);
    setError(null);
    setIsLoading(true);
    getMessages(id)
      .then(async ({ data, error }) => {
        if (currentIdRef.current !== id) return; // switched away mid-load
        if (error) {
          setError(error.message);
          setMessages([]);
        } else {
          const items = await rowsToItems(data ?? []);
          if (currentIdRef.current !== id) return; // switched away mid-resolve
          setMessages(items);
        }
      })
      .finally(() => {
        if (currentIdRef.current === id) setIsLoading(false);
      });
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
      setError('You need to be signed in to chat.');
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
          params.displayText || (params.image ? 'Shared an image' : '')
        );
        const { data, error } = await createConversation(profile.id, title);
        if (error || !data) throw error ?? new Error('Could not start a chat.');
        convId = data.id;
        currentIdRef.current = convId;
        setActiveId(convId);
      }

      // 2. Optimistic user bubble + persist.
      setMessages((m) => [
        ...m,
        {
          id: tempId(),
          role: 'user',
          content: params.displayText,
          imageUrl: params.image?.previewUrl ?? null,
        },
      ]);
      await appendMessage({
        conversation_id: convId,
        user_id: profile.id,
        role: 'user',
        content: params.displayText,
        attachment_id: params.image?.attachmentId ?? null,
      });

      // 3. Ground in the current budget state.
      const ctx = await buildBudgetContext(profile);
      if (ctx.error || !ctx.data) {
        throw ctx.error ?? new Error('Could not load your budget state.');
      }

      // 4. Agentic loop: the model may call read tools (auto-executed here,
      //    reusing the RLS-scoped api layer) and reason over the results before
      //    answering. Write proposals (propose_*) end the loop with a card —
      //    they are never executed without user confirmation.
      const apiMessages: MessageParam[] = [
        ...history,
        { role: 'user', content: params.apiContent },
      ];
      // First step honors the caller's tool_choice (images force a tool to get
      // a clean extraction); later steps let the model decide freely.
      let toolChoice = params.toolChoice;
      let res: ChatResponse | null = null;

      for (let step = 0; step < MAX_STEPS; step++) {
        res = await sendChat({
          system: ctx.data.system,
          messages: apiMessages,
          tools: AGENT_TOOLS,
          tool_choice: toolChoice,
        });
        if (res.error) throw new Error(res.error);

        const blocks = res.content ?? [];
        const hasWrite = blocks.some(
          (b) => b.type === 'tool_use' && isWriteTool(b.name)
        );
        if (hasWrite) break; // terminal: a write proposal needs confirmation

        const readUses = blocks.filter(
          (b): b is ToolUseBlock =>
            b.type === 'tool_use' && !isWriteTool(b.name)
        );
        if (readUses.length === 0) break; // terminal: plain text answer

        // Execute the requested reads and replay the results to the model.
        apiMessages.push({ role: 'assistant', content: blocks });
        const results: ToolResultBlock[] = await Promise.all(
          readUses.map(async (u) => ({
            type: 'tool_result' as const,
            tool_use_id: u.id,
            content: await executeReadTool(u.name, u.input, profile),
          }))
        );
        apiMessages.push({ role: 'user', content: results });
        toolChoice = { type: 'auto' };
      }

      if (!res) throw new Error('The assistant could not respond.');

      // 5. Resolve the terminal response: a transaction proposal, a generic
      //    change proposal, or a plain answer. Persist the assistant text.
      const txProposal = parseProposal(res);
      const change = txProposal ? null : parseChange(res);
      const text =
        extractText(res) ||
        (txProposal
          ? summarizeProposal(txProposal)
          : change
            ? change.summary
            : 'Sorry, I could not generate a response.');

      setMessages((m) => [
        ...m,
        { id: tempId(), role: 'assistant', content: text },
      ]);
      await appendMessage({
        conversation_id: convId,
        user_id: profile.id,
        role: 'assistant',
        content: text,
        model: res.model ?? null,
        tokens_input: res.usage?.input_tokens ?? null,
        tokens_output: res.usage?.output_tokens ?? null,
      });

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
        setPendingChange(change);
      }

      await touchConversation(convId, {
        last_message_at: new Date().toISOString(),
      });
      options.onConversationsChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
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
      setError('You need to be signed in to chat.');
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
          err instanceof Error ? err.message : 'Could not read the image.'
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

  // Applies a confirmed generic change (create/update/delete) via the owning
  // feature's api layer, then notes it in the thread. Read-auto / write-confirm:
  // nothing here runs until the user taps confirm.
  function confirmChange() {
    const change = pendingChange;
    if (!change || !profile || confirmingChange) return;
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
        noteConfirmation(`Done — ${change.summary}`);
      })
      .finally(() => setConfirmingChange(false));
  }

  // Appends + persists a short confirmation note after a proposal is saved.
  function noteConfirmation(text: string) {
    setProposal(null);
    setMessages((m) => [
      ...m,
      { id: tempId(), role: 'assistant', content: text },
    ]);
    const convId = currentIdRef.current;
    if (convId && profile) {
      void appendMessage({
        conversation_id: convId,
        user_id: profile.id,
        role: 'assistant',
        content: text,
      }).then(() => {
        void touchConversation(convId, {
          last_message_at: new Date().toISOString(),
        });
        options.onConversationsChanged?.();
      });
    }
  }

  return {
    activeId,
    messages,
    isLoading,
    sending,
    error,
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
