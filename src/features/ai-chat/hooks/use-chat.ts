import { useRef, useState } from 'react';
import { useAuth } from '@/features/auth';
import {
  appendMessage,
  buildBudgetContext,
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
  TRANSACTION_TOOLS,
} from '../api';
import type {
  ChatItem,
  ImageBlock,
  MessageParam,
  PendingAttachment,
  ProposedTransaction,
  TextBlock,
  ToolChoice,
} from '../types';

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
  selectConversation: (id: string) => void;
  startNew: () => void;
  send: (text: string) => void;
  sendImage: (file: File, caption?: string) => void;
  dismissProposal: () => void;
  noteConfirmation: (text: string) => void;
};

function tempId(): string {
  return crypto.randomUUID();
}

function rowsToItems(
  rows: { id: string; role: string; content: string }[]
): ChatItem[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content,
  }));
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

  const currentIdRef = useRef<string | null>(null);

  function startNew() {
    currentIdRef.current = null;
    setActiveId(null);
    setMessages([]);
    setProposal(null);
    setError(null);
  }

  function selectConversation(id: string) {
    if (currentIdRef.current === id) return;
    currentIdRef.current = id;
    setActiveId(id);
    setProposal(null);
    setError(null);
    setIsLoading(true);
    getMessages(id)
      .then(({ data, error }) => {
        if (currentIdRef.current !== id) return; // switched away mid-load
        if (error) {
          setError(error.message);
          setMessages([]);
        } else {
          setMessages(rowsToItems(data ?? []));
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
        const { data, error } = await createConversation(
          profile.id,
          conversationTitleFrom(params.displayText)
        );
        if (error || !data) throw error ?? new Error('Could not start a chat.');
        convId = data.id;
        currentIdRef.current = convId;
        setActiveId(convId);
      }

      // 2. Optimistic user bubble + persist.
      setMessages((m) => [
        ...m,
        { id: tempId(), role: 'user', content: params.displayText },
      ]);
      await appendMessage({
        conversation_id: convId,
        user_id: profile.id,
        role: 'user',
        content: params.displayText,
      });

      // 3. Ground in the current budget state.
      const ctx = await buildBudgetContext(profile);
      if (ctx.error || !ctx.data) {
        throw ctx.error ?? new Error('Could not load your budget state.');
      }

      // 4. Call Claude with text-only history + this turn's content.
      const apiMessages: MessageParam[] = [
        ...history,
        { role: 'user', content: params.apiContent },
      ];
      const res = await sendChat({
        system: ctx.data.system,
        messages: apiMessages,
        tools: TRANSACTION_TOOLS,
        tool_choice: params.toolChoice,
      });
      if (res.error) throw new Error(res.error);

      // 5. Resolve text + optional proposal; persist the assistant text.
      const parsed = parseProposal(res);
      const text =
        extractText(res) ||
        (parsed
          ? summarizeProposal(parsed)
          : 'Sorry, I could not generate a response.');

      setMessages((m) => [...m, { id: tempId(), role: 'assistant', content: text }]);
      await appendMessage({
        conversation_id: convId,
        user_id: profile.id,
        role: 'assistant',
        content: text,
        model: res.model ?? null,
        tokens_input: res.usage?.input_tokens ?? null,
        tokens_output: res.usage?.output_tokens ?? null,
      });

      // 6. Stage an inline proposal card. For images, store the file now that we
      //    know whether it's an expense or income document.
      if (parsed) {
        let attachment: PendingAttachment | null = null;
        if (params.imageFile) {
          const created = await createImageAttachment(
            params.imageFile,
            parsed.kind,
            profile.id
          );
          if (!created.error && created.data) attachment = created.data;
        }
        setProposal({ proposal: parsed, attachment });
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
    const text = (caption ?? '').trim();
    void (async () => {
      try {
        const { media_type, data } = await fileToBase64(file);
        await runTurn({
          apiContent: [
            { type: 'image', source: { type: 'base64', media_type, data } },
            {
              type: 'text',
              text: text || 'Log this transaction from the attached image.',
            },
          ],
          displayText: text ? `🧾 ${text}` : '🧾 Sent an image',
          toolChoice: { type: 'any' },
          imageFile: file,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read the image.');
      }
    })();
  }

  function dismissProposal() {
    setProposal(null);
  }

  // Appends + persists a short confirmation note after a proposal is saved.
  function noteConfirmation(text: string) {
    setProposal(null);
    setMessages((m) => [...m, { id: tempId(), role: 'assistant', content: text }]);
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
    selectConversation,
    startNew,
    send,
    sendImage,
    dismissProposal,
    noteConfirmation,
  };
}
