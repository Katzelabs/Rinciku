import { useState } from 'react';
import { PanelLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { deleteConversation, touchConversation } from '../api';
import { ChatThread } from '../components/chat-thread';
import { ConversationList } from '../components/conversation-list';
import { MessageComposer } from '../components/message-composer';
import { useChat } from '../hooks/use-chat';
import { useConversations } from '../hooks/use-conversations';

export function ChatPage() {
  const {
    data: conversations,
    isLoading: conversationsLoading,
    refetch,
  } = useConversations();

  const chat = useChat({ onConversationsChanged: refetch });
  const [historyOpen, setHistoryOpen] = useState(false);

  function handleSelect(id: string) {
    chat.selectConversation(id);
    setHistoryOpen(false);
  }

  function handleNew() {
    chat.startNew();
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
    if (chat.activeId === id) chat.startNew();
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
          onSelect={chat.selectConversation}
          onNew={chat.startNew}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </aside>

      <section className='flex min-w-0 flex-1 flex-col'>
        <div className='flex items-center justify-between gap-2 border-b p-2 md:hidden'>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setHistoryOpen(true)}
              aria-label='Open conversation history'
            >
              <PanelLeft className='size-4' />
            </Button>
            <span className='text-sm font-medium'>AI Chat</span>
          </div>
          <Button variant='outline' size='sm' onClick={chat.startNew}>
            <Plus className='size-4' />
            New
          </Button>
        </div>

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
          onSendExample={chat.send}
          onProposalConfirmed={chat.noteConfirmation}
          onProposalCancel={chat.dismissProposal}
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
