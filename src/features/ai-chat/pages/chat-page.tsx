import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div className='flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-card'>
      <aside className='hidden w-64 shrink-0 border-r md:flex md:flex-col'>
        <ConversationList
          conversations={conversations}
          isLoading={conversationsLoading}
          activeId={chat.activeId}
          onSelect={chat.selectConversation}
          onNew={chat.startNew}
        />
      </aside>

      <section className='flex min-w-0 flex-1 flex-col'>
        <div className='flex items-center justify-between gap-2 border-b p-2 md:hidden'>
          <span className='px-1 text-sm font-medium'>AI Chat</span>
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
          onProposalConfirmed={chat.noteConfirmation}
          onProposalCancel={chat.dismissProposal}
        />

        <MessageComposer
          sending={chat.sending}
          onSend={chat.send}
          onSendImage={chat.sendImage}
        />
      </section>
    </div>
  );
}
