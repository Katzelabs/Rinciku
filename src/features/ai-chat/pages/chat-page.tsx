import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { deleteConversation, touchConversation } from '../api';
import { ChatHeader } from '../components/chat-header';
import { ChatThread } from '../components/chat-thread';
import { ConversationList } from '../components/conversation-list';
import { MessageComposer } from '../components/message-composer';
import { useChat } from '../hooks/use-chat';
import { useConversations } from '../hooks/use-conversations';

export function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const {
    data: conversations,
    isLoading: conversationsLoading,
    refetch,
  } = useConversations();

  const chat = useChat({
    onConversationsChanged: refetch,
    // First send creates the conversation lazily — reflect its id in the URL.
    // Replace so the empty /ai-chat doesn't linger in the back stack.
    onConversationCreated: (id) =>
      navigate(`/ai-chat/${id}`, { replace: true }),
  });
  const [historyOpen, setHistoryOpen] = useState(false);

  // URL is the source of truth: load the conversation from the path (or reset to
  // a fresh thread on bare /ai-chat). A ref tracks the last-synced id so this
  // only acts on real param changes, not on every render.
  const syncedIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const target = conversationId ?? null;
    if (syncedIdRef.current === target) return;
    syncedIdRef.current = target;
    if (target) chat.selectConversation(target);
    else chat.startNew();
  }, [conversationId, chat]);

  const activeConversation =
    conversations?.find((c) => c.id === chat.activeId) ?? null;

  function handleSelect(id: string) {
    navigate(`/ai-chat/${id}`);
    setHistoryOpen(false);
  }

  function handleNew() {
    navigate('/ai-chat');
    setHistoryOpen(false);
  }

  async function handleRename(id: string, title: string) {
    const { error } = await touchConversation(id, { title });
    if (error) {
      toast.error('Could not rename the chat.');
      return;
    }
    refetch();
  }

  async function handleDelete(id: string) {
    const { error } = await deleteConversation(id);
    if (error) {
      toast.error('Could not delete the chat.');
      return;
    }
    if (chat.activeId === id) navigate('/ai-chat');
    refetch();
    toast.success('Chat deleted.');
  }

  return (
    <div className='flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-card'>
      <aside className='hidden w-72 shrink-0 border-r md:flex md:flex-col'>
        <ConversationList
          conversations={conversations}
          isLoading={conversationsLoading}
          activeId={chat.activeId}
          onSelect={handleSelect}
          onNew={handleNew}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </aside>

      <section className='flex min-w-0 flex-1 flex-col'>
        <ChatHeader
          conversation={activeConversation}
          onRename={handleRename}
          onDelete={handleDelete}
          onNew={handleNew}
          onOpenHistory={() => setHistoryOpen(true)}
        />

        {chat.error ? (
          <p className='border-b bg-destructive/10 px-4 py-2 text-sm text-destructive'>
            {chat.error}
          </p>
        ) : null}

        <ChatThread
          messages={chat.messages}
          isLoading={chat.isLoading}
          sending={chat.sending}
          proposal={chat.proposal}
          pendingChange={chat.pendingChange}
          confirmingChange={chat.confirmingChange}
          onSendExample={chat.send}
          onProposalConfirmed={chat.noteConfirmation}
          onProposalCancel={chat.dismissProposal}
          onChangeConfirm={chat.confirmChange}
          onChangeCancel={chat.dismissChange}
        />

        <MessageComposer
          sending={chat.sending}
          onSend={chat.send}
          onSendImage={chat.sendImage}
        />
      </section>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side='left' className='w-80 p-0'>
          <SheetHeader className='sr-only'>
            <SheetTitle>Conversations</SheetTitle>
          </SheetHeader>
          <ConversationList
            conversations={conversations}
            isLoading={conversationsLoading}
            activeId={chat.activeId}
            onSelect={handleSelect}
            onNew={handleNew}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
